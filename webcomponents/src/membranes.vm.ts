import {createContext} from "@lit-labs/context";
import {LitElement} from "lit";
import { writable, Writable, derived, Readable, get, readable } from 'svelte/store';
import {EntryHashB64, ActionHashB64, AgentPubKeyB64, Dictionary} from '@holochain-open-dev/core-types';
import {AgnosticClient, CellClient} from '@holochain-open-dev/cell-client';
import {AgentPubKey, CellId, EntryHash} from "@holochain/client";
import {deserializeHash, serializeHash} from "@holochain-open-dev/utils";
import {MembranesBridge} from "./membranes.bridge";
import {
  CreateEntryCountThreshold,
  MembraneCrossedClaimEntry,
  MembraneEntry,
  MembraneRoleEntry,
  MembraneThresholdEntry, MyAppEntryType,
  Privilege,
  RoleClaimEntry, ThresholdReachedProof, VouchEntry, VouchThreshold
} from "./membranes.types";


/** */
export function areThresholdEqual(first: MembraneThresholdEntry, second: MembraneThresholdEntry) : Boolean {
  if (first.hasOwnProperty("entryType")) {
    if (!second.hasOwnProperty("entryType")) return false;
    const firstCreate = first as CreateEntryCountThreshold;
    const secondCreate = second as CreateEntryCountThreshold;
    return firstCreate.requiredCount == secondCreate.requiredCount && firstCreate.entryType == secondCreate.entryType;
  }
  const firstVouch = first as VouchThreshold;
  const secondVouch = second as VouchThreshold;
  return firstVouch == secondVouch;
}

export function areMembraneEqual(first: Membrane, second: Membrane) : Boolean {
  if (first.thresholds.length !== second.thresholds.length) return false;
  for(let i = 0; i< first.thresholds.length; i++) {
    if (!areThresholdEqual(first.thresholds[i], second.thresholds[i])) {
      return false;
    }
  }
  return true;
}


/** ViewModel */

export interface Vouch {
  subject: AgentPubKeyB64,
  forRole: string,
}


export interface Membrane {
  thresholds: MembraneThresholdEntry[]
}

export interface MembraneRole {
  name: string,
  privileges: Privilege[],
  enteringMembranes: Membrane[],
}


export interface MembraneCrossedClaim {
  proofs: ThresholdReachedProof[], // TODO a B64 type of SignedActionHashed
  membrane: Membrane,
  subject: AgentPubKeyB64,
}

export interface RoleClaim {
  subject: AgentPubKeyB64,
  membraneIndex: number,
  role: MembraneRole,
  membraneClaim: MembraneCrossedClaim,
}


export const membranesContext = createContext<MembranesViewModel>('membranes/service');


/**
 *
 */
export class MembranesViewModel {
  /** Ctor */
  constructor(protected client: AgnosticClient, cellId: CellId) {
    this._bridge = new MembranesBridge(client, cellId);
  }


  /** -- Fields -- */
  private _bridge : MembranesBridge

  /** EntryHashB64 -> <typed> */
  thresholdStore: Writable<Dictionary<MembraneThresholdEntry>> = writable({});
  membraneStore: Writable<Dictionary<Membrane>> = writable({});
  roleStore: Writable<Dictionary<MembraneRole>> = writable({});
  myRoleClaimsStore: Writable<Dictionary<RoleClaim>> = writable({});
  myMembraneClaimsStore: Writable<Dictionary<MembraneCrossedClaim>> = writable({});
  /** RoleName -> [[emitted],[[received,author]]] */
  myVouchesStore: Writable<Dictionary<[Vouch[], [Vouch, AgentPubKeyB64][]]>> = writable({});


  /** -- Methods -- */

  findMembrane(membrane: Membrane): EntryHashB64 | undefined {
    //console.log("findMembrane() called", membrane);
    let result = Object.entries(get(this.membraneStore)).find(([_ehb64, cur]) => {
      return areMembraneEqual(cur, membrane);
    })
    //console.log("findMembrane()", membrane, result)
    return result && result.length > 0? result[0] : undefined;
  }


  /** */
  private convertVouchEntry(entry: VouchEntry): Vouch {
    return {subject: serializeHash(entry.subject), forRole: entry.forRole};
  }

  /** */
  private async convertMembraneEntry(membraneEntry: MembraneEntry): Promise<Membrane> {
    //console.log("convertMembraneEntry() called", membraneEntry)
    let thresholdStore = get(this.thresholdStore);
    let thresholds = []
    for (const thresholdEh of membraneEntry.thresholdEhs) {
      let maybeStoredThreshold = thresholdStore[serializeHash(thresholdEh)];
      if (!maybeStoredThreshold) {
        maybeStoredThreshold = await this.pullThreshold(thresholdEh);
      }
      thresholds.push(maybeStoredThreshold)
    }
    let membrane = {thresholds}
    //console.log("convertMembraneEntry() result", membrane)
    return membrane;
  }


  /** */
  private async convertRoleEntry(entry: MembraneRoleEntry): Promise<MembraneRole> {
    let membraneStore = get(this.membraneStore);
    let enteringMembranes = []
    for (const membraneEh of entry.enteringMembraneEhs) {
      let maybeStoredMembrane = membraneStore[serializeHash(membraneEh)];
      if (!maybeStoredMembrane) {
        maybeStoredMembrane = await this.pullMembrane(membraneEh);
      }
      enteringMembranes.push(maybeStoredMembrane)
    }
    return {name: entry.name, privileges: entry.privileges, enteringMembranes};
  }


  /** */
  private async convertMembraneCrossedClaimEntry(membraneClaimEntry: MembraneCrossedClaimEntry): Promise<MembraneCrossedClaim> {
    //console.log("convertMembraneCrossedClaimEntry() called", membraneClaimEntry)
    let membraneClaim = {
      proofs: membraneClaimEntry.proofs,
      subject: serializeHash(membraneClaimEntry.subject),
      membrane: await this.pullMembrane(membraneClaimEntry.membraneEh),
    };
    //console.log("convertMembraneCrossedClaimEntry() result", membraneClaim)
    return membraneClaim;
  }

  /** */
  private async convertRoleClaimEntry(entry: RoleClaimEntry): Promise<RoleClaim> {
    //console.log("convertRoleClaimEntry() called", entry)
    let roleClaim = {
      subject: serializeHash(entry.subject),
      membraneIndex: entry.membraneIndex,
      role: await this.pullRole(entry.roleEh),
      membraneClaim: await this.pullMembraneCrossedClaim(entry.membraneClaimEh),

    };
    //console.log("convertRoleClaimEntry() result", roleClaim)
    return roleClaim;
  }


  /** */
  private async pullThreshold(eh: EntryHash): Promise<MembraneThresholdEntry> {
    //console.log("pullThreshold() called", eh)
    let thB64 = serializeHash(eh)
    const maybeThreshold = await this._bridge.getThreshold(eh)
    if (!maybeThreshold) {
      console.warn("pullThreshold() Failed. Can't find Threshold at " + thB64)
      return Promise.reject("pullThreshold() Failed. Can't find Threshold at " + thB64);
    }
    this.thresholdStore.update(store => {
      store[thB64] = maybeThreshold!;
      return store;
    });
    return maybeThreshold;
  }


  /** */
  private async pullMembrane(eh: EntryHash): Promise<Membrane> {
    //console.log("pullMembrane() called", eh)
    let b64 = serializeHash(eh)
    const maybeEntry = await this._bridge.getMembrane(eh)
    if (!maybeEntry) {
      console.warn("pullMembrane() Failed. Can't find Membrane at " + b64)
      return Promise.reject("pullMembrane() Failed. Can't find Membrane at " + b64);
    }
    const membrane = await this.convertMembraneEntry(maybeEntry!)
    this.membraneStore.update(store => {
      store[b64] = membrane;
      return store;
    });
    return membrane;
  }


  /** */
  private async pullMembraneCrossedClaim(eh: EntryHash): Promise<MembraneCrossedClaim> {
    //console.log("pullMembraneCrossedClaim() called", eh)
    let b64 = serializeHash(eh)
    const maybeEntry = await this._bridge.getMembraneCrossedClaim(eh)
    if (!maybeEntry) {
      console.warn("pullMembraneCrossedClaim() Failed. Can't find Membrane at " + b64)
      return Promise.reject("pullMembraneCrossedClaim() Failed. Can't find Membrane at " + b64);
    }
    const claim = await this.convertMembraneCrossedClaimEntry(maybeEntry!)
    return claim;
  }


  /** */
  private async pullRole(eh: EntryHash): Promise<MembraneRole> {
    //console.log("pullRole() called", eh)
    let b64 = serializeHash(eh)
    const maybeEntry = await this._bridge.getRole(eh)
    if (!maybeEntry) {
      console.warn("pullRole() Failed. Can't find Role at " + b64)
      return Promise.reject("pullRole() Failed. Can't find Role at " + b64);
    }
    const role = await this.convertRoleEntry(maybeEntry!)
    this.roleStore.update(store => {
      store[b64] = role;
      return store;
    });
    return role;
  }


  /** Subscribe parent to all store updates */
  subscribe(parent: LitElement) {
    this.thresholdStore.subscribe((_v) => {parent.requestUpdate()});
    this.membraneStore.subscribe((_v) => {parent.requestUpdate()});
    this.roleStore.subscribe((_v) => {parent.requestUpdate()});
    this.myRoleClaimsStore.subscribe((_v) => {parent.requestUpdate()});
    this.myMembraneClaimsStore.subscribe((_v) => {parent.requestUpdate()});
    this.myVouchesStore.subscribe((_v) => {parent.requestUpdate()});
  }

  /** */
  async pullAllThresholds() {
    const thresholdEntries = await this._bridge.getAllThresholds();
    let thStore: Dictionary<MembraneThresholdEntry> = {};
    for (const [eh, typed] of thresholdEntries) {
      const b64 = serializeHash(eh);
      thStore[b64] = typed;
    }
    this.thresholdStore.set(thStore);
    console.log({thresholdStore: this.thresholdStore})
  }


  /** */
  async pullAllMembranes() {
    const membraneEntries = await this._bridge.getAllMembranes();
    //console.log("membraneEntries:", membraneEntries)
    let membraneStore: Dictionary<Membrane> = {};
    for (const [eh, membraneEntry] of membraneEntries) {
      const b64 = serializeHash(eh);
      const membrane = await this.convertMembraneEntry(membraneEntry)
      membraneStore[b64] = membrane;
    }
    this.membraneStore.set(membraneStore);
    console.log({membraneStore: this.membraneStore})
  }


  /** */
  async pullAllRoles(): Promise<[EntryHash, MembraneRoleEntry][]> {
    const roleEntries = await this._bridge.getAllRoles();
    //console.log("roleEntries:", roleEntries)
    let roleStore: Dictionary<MembraneRole> = {};
    for (const [eh, roleEntry] of roleEntries) {
      const b64 = serializeHash(eh);
      const role = await this.convertRoleEntry(roleEntry);
      roleStore[b64] = role;
    }
    this.roleStore.set(roleStore);
    console.log({roleStore: this.roleStore})
    return roleEntries;
  }


  /** */
  async pullAllFromDht() {
    await this.pullAllThresholds();
    await this.pullAllMembranes();
    const roleEntries = await this.pullAllRoles();
    await this.pullAllMyVouches(roleEntries);
    await this.pullMyClaims();
  }


  async pullAllMyVouches(roleEntries: [EntryHash, MembraneRoleEntry][]) {
    for (const [eh, roleEntry] of roleEntries) {
      const emittedEhs = await this._bridge.getMyEmittedVouches(roleEntry.name);
      const receivedPairs: [EntryHash, AgentPubKey][] = await this._bridge.getMyReceivedVouches(roleEntry.name);
      /* */
      let emitted: Vouch[] = [];
      for (const eh of emittedEhs) {
        const vouch = await this._bridge.getVouch(eh);
        if (vouch) {
          emitted.push(this.convertVouchEntry(vouch))
        }
      }
      /* */
      let received: [Vouch, AgentPubKeyB64][] = [];
      for (const [eh, author] of receivedPairs) {
        const vouch = await this._bridge.getVouch(eh);
        if (vouch) {
          const pair: [Vouch, AgentPubKeyB64] = [this.convertVouchEntry(vouch), serializeHash(author)]
          received.push(pair)
        }
      }
      /* */
      this.myVouchesStore.update(store => {
        store[roleEntry.name] = [emitted, received];
        return store;
      });
    }
  }


  /** */
  async claimAll() {
    await this._bridge.claimAllRoles();
    this.pullMyClaims();
  }


  /** */
  async pullMyClaims() {
    /** Role Claims */
    const myRoleClaims = await this._bridge.myClaimedRoles();
    let store: Dictionary<RoleClaim> = {}
    for (const [eh, entry] of myRoleClaims) {
      const b64 = serializeHash(eh);
      const claim = await this.convertRoleClaimEntry(entry);
      store[b64] = claim
    }
    this.myRoleClaimsStore.set(store);
    console.log("pullMyClaims() myRoleClaimsStore:", this.myRoleClaimsStore)
    /** Membrane Claims */
    const myMembraneClaims = await this._bridge.myClaimedMembranes();
    let membraneClaimStore: Dictionary<MembraneCrossedClaim> = {}
    for (const [eh, entry] of myMembraneClaims) {
      const b64 = serializeHash(eh);
      const claim = await this.convertMembraneCrossedClaimEntry(entry);
      membraneClaimStore[b64] = claim
    }
    this.myMembraneClaimsStore.set(membraneClaimStore);
    console.log("pullMyClaims() myMembraneClaimsStore:", this.myMembraneClaimsStore)
  }


  /** */
  async createRole(name: string, membraneEhs: EntryHashB64[]): Promise<EntryHash> {
    const enteringMembraneEhs: EntryHash[] = Object.values(membraneEhs).map((ehb64) => deserializeHash(ehb64));
    const role: MembraneRoleEntry = {
      name,
      privileges: [],
      enteringMembraneEhs,
    };
    const res = await this._bridge.publishRole(role);
    this.pullAllRoles();
    return res;
  }


  /** */
  async createMembrane(ehs: EntryHashB64[]): Promise<EntryHash> {
    const thresholdEhs: EntryHash[] = Object.values(ehs).map((ehb64) => deserializeHash(ehb64));
    const membrane: MembraneEntry = {
      thresholdEhs,
    };
    let res = await this._bridge.publishMembrane(membrane);
    this.pullAllMembranes();
    return res;
  }


  /** */
  async createVouchThreshold(requiredCount: number, byRole: string, forRole: string): Promise<EntryHash> {
    const typed: VouchThreshold = {
      requiredCount, byRole, forRole
    };
    let res = await this._bridge.publishVouchThreshold(typed);
    this.pullAllThresholds();
    return res;
  }


  /** */
  async createCreateEntryCountThreshold(entryType: MyAppEntryType, requiredCount: number): Promise<EntryHash> {
    const typed: CreateEntryCountThreshold = {
      entryType: entryType,
      requiredCount: requiredCount,
    };
    let res = await this._bridge.publishCreateEntryCountThreshold(typed);
    this.pullAllThresholds();
    return res;
  }


  async vouchAgent(agent: AgentPubKeyB64, forRole: string): Promise<EntryHash> {
    const res = await this._bridge.publishVouch({subject: deserializeHash(agent), forRole});
    this.pullAllFromDht();
    return res;
  }


  /* */
  async getVouchAuthor(vouch: Vouch): Promise<AgentPubKeyB64> {
    let entry: VouchEntry = {subject: deserializeHash(vouch.subject), forRole: vouch.forRole};
    let res = await this._bridge.getVouchAuthor(entry);
    return serializeHash(res);
  }


  /** */
  async getCreateCount(agent: AgentPubKeyB64, entryType: MyAppEntryType): Promise<number> {
    return this._bridge.getCreateCount({subject: deserializeHash(agent), entryType});
  }

}
