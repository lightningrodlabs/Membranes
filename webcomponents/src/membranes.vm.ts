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
    this.myAgentPubKey = serializeHash(cellId[1]);
  }

  myAgentPubKey: AgentPubKeyB64;

  /** Fields */
  private _bridge : MembranesBridge


  /** EntryHashB64 -> <typed> */
  thresholdStore: Dictionary<MembraneThresholdEntry> = {};
  membraneStore: Dictionary<Membrane> = {};
  roleStore: Dictionary<MembraneRole> = {};

  myRoleClaimsStore: Dictionary<RoleClaim> = {};
  myMembraneClaimsStore: Dictionary<MembraneCrossedClaim> = {};

  /** RoleName -> [[emitted],[[received,author]]] */
  myVouchesStore: Writable<Dictionary<[Vouch[], [Vouch, AgentPubKeyB64][]]>> = writable({});


  /** Methods */

  findMembrane(membrane: Membrane): EntryHashB64 | undefined {
    let result = Object.entries(this.membraneStore).find(([_ehb64, cur]) => {
      return areMembraneEqual(cur, membrane);
    })
    console.log("findMembrane()", membrane, result)
    return result && result.length > 0? result[0] : undefined;
  }


  /** */
  private convertVouchEntry(entry: VouchEntry): Vouch {
    return {subject: serializeHash(entry.subject), forRole: entry.forRole};
  }

  /** */
  private async convertMembraneEntry(membraneEntry: MembraneEntry): Promise<Membrane> {
    //console.log("convertMembraneEntry() called", membraneEntry)
    let thresholds = []
    for (const thresholdEh of membraneEntry.thresholdEhs) {
      let maybeStoredThreshold = this.thresholdStore[serializeHash(thresholdEh)];
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
    let enteringMembranes = []
    for (const membraneEh of entry.enteringMembraneEhs) {
      let maybeStoredMembrane = this.membraneStore[serializeHash(membraneEh)];
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
    this.thresholdStore[thB64] = maybeThreshold!
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
    this.membraneStore[b64] = membrane
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
    this.roleStore[b64] = role
    return role;
  }


  subscribe(parent: LitElement) {
    // this._taskListEntryStore.subscribe((_value) => {
    //   //console.log("localTaskListStore update called");
    //   parent.requestUpdate();
    // });
  }

  /** */
  async pullAllFromDht() {
    /** Get Thresholds */
    const thresholdEntries = await this._bridge.getAllThresholds();
    for (const [eh, typed] of thresholdEntries) {
      const b64 = serializeHash(eh);
      this.thresholdStore[b64] = typed
    }
    console.log({thresholdStore: this.thresholdStore})

    /** Get Membranes */
    const membraneEntries = await this._bridge.getAllMembranes();
    //console.log("membraneEntries:", membraneEntries)
    for (const [eh, membraneEntry] of membraneEntries) {
      const b64 = serializeHash(eh);
      const membrane = await this.convertMembraneEntry(membraneEntry)
      this.membraneStore[b64] = membrane
    }
    console.log({membraneStore: this.membraneStore})

    /** Get Roles */
    const roleEntries = await this._bridge.getAllRoles();
    //console.log("roleEntries:", roleEntries)
    for (const [eh, roleEntry] of roleEntries) {
      const b64 = serializeHash(eh);
      const role = await this.convertRoleEntry(roleEntry);
      this.roleStore[b64] = role
    }
    console.log({roleStore: this.roleStore})

    /** Get Vouches */

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
    //this.bridge.claimAllMembranes();
    await this._bridge.claimAllRoles();
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
    this.myRoleClaimsStore = store;
    console.log("pullMyClaims() myRoleClaimsStore:", this.myRoleClaimsStore)
    /** Membrane Claims */
    const myMembraneClaims = await this._bridge.myClaimedMembranes();
    let membraneClaimStore: Dictionary<MembraneCrossedClaim> = {}
    for (const [eh, entry] of myMembraneClaims) {
      const b64 = serializeHash(eh);
      const claim = await this.convertMembraneCrossedClaimEntry(entry);
      membraneClaimStore[b64] = claim
    }
    this.myMembraneClaimsStore = membraneClaimStore;
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
    return this._bridge.publishRole(role);
  }


  /** */
  async createMembrane(ehs: EntryHashB64[]): Promise<EntryHash> {
    const thresholdEhs: EntryHash[] = Object.values(ehs).map((ehb64) => deserializeHash(ehb64));
    const membrane: MembraneEntry = {
      thresholdEhs,
    };
    return this._bridge.publishMembrane(membrane);
  }


  /** */
  async createVouchThreshold(requiredCount: number, byRole: string, forRole: string): Promise<EntryHash> {
    const typed: VouchThreshold = {
      requiredCount, byRole, forRole
    };
    return this._bridge.publishVouchThreshold(typed);
  }


  /** */
  async createCreateEntryCountThreshold(entryType: MyAppEntryType, requiredCount: number): Promise<EntryHash> {
    const typed: CreateEntryCountThreshold = {
      entryType: entryType,
      requiredCount: requiredCount,
    };
    return this._bridge.publishCreateEntryCountThreshold(typed);
  }


  async vouchAgent(agent: AgentPubKeyB64, forRole: string): Promise<EntryHash> {
    return this._bridge.publishVouch({subject: deserializeHash(agent), forRole});
  }


  /* */
  async getVouchAuthor(vouch: Vouch): Promise<AgentPubKeyB64> {
    let entry: VouchEntry = {subject: deserializeHash(vouch.subject), forRole: vouch.forRole};
    let res = await this._bridge.getVouchAuthor(entry);
    return serializeHash(res);
  }

  async getCreateCount(agent: AgentPubKeyB64, entryType: MyAppEntryType): Promise<number> {
    return this._bridge.getCreateCount({subject: deserializeHash(agent), entryType});
  }

}
