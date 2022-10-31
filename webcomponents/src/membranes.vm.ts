import {EntryHashB64, ActionHashB64, AgentPubKeyB64, Dictionary} from '@holochain-open-dev/core-types';
import {AgnosticClient, CellClient} from '@holochain-open-dev/cell-client';
import {AgentPubKey, AppEntryType, CellId, EntryHash, SignedActionHashed} from "@holochain/client";
import {deserializeHash, serializeHash} from "@holochain-open-dev/utils";
import {MembranesBridge} from "./membranes.bridge";
import {
  CreateEntryCountThreshold,
  MembraneCrossedClaimEntry,
  MembraneEntry,
  MembraneRoleEntry,
  MembraneThresholdEntry, MyAppEntryType,
  Privilege,
  RoleClaimEntry, ThresholdReachedProof, VouchThreshold
} from "./membranes.types";
import {createContext} from "@lit-labs/context";


const areEqual = (first: Uint8Array, second: Uint8Array) =>
      first.length === second.length && first.every((value, index) => value === second[index]);


/** ViewModel */

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


/** */
export class MembranesViewModel {

  /** Ctor */
  constructor(protected client: AgnosticClient, cellId: CellId) {
    this.bridge = new MembranesBridge(client, cellId);
    this.myAgentPubKey = serializeHash(cellId[1]);
  }


  /** Fields */
  private bridge : MembranesBridge

  myAgentPubKey: AgentPubKeyB64;

  /** EntryHashB64 -> <typed> */
  thresholdStore: Dictionary<MembraneThresholdEntry> = {};
  membraneStore: Dictionary<Membrane> = {};
  roleStore: Dictionary<MembraneRole> = {};

  myRoleClaimsStore: Dictionary<RoleClaim> = {};
  myMembraneClaimsStore: Dictionary<MembraneCrossedClaim> = {};

  /** Methods */

  /** */
  private async convertMembraneEntry(membraneEntry: MembraneEntry): Promise<Membrane> {
    console.log("convertMembraneEntry() called", membraneEntry)
    let thresholds = []
    for (const thresholdEh of membraneEntry.thresholdEhs) {
      let maybeStoredThreshold = this.thresholdStore[serializeHash(thresholdEh)];
      if (!maybeStoredThreshold) {
        maybeStoredThreshold = await this.pullThreshold(thresholdEh);
      }
      thresholds.push(maybeStoredThreshold)
    }
    let membrane = {thresholds}
    console.log("convertMembraneEntry() result", membrane)
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
    console.log("convertMembraneCrossedClaimEntry() called", membraneClaimEntry)
    let membraneClaim = {
      proofs: membraneClaimEntry.proofs,
      subject: serializeHash(membraneClaimEntry.subject),
      membrane: await this.pullMembrane(membraneClaimEntry.membraneEh),
    };
    console.log("convertMembraneCrossedClaimEntry() result", membraneClaim)
    return membraneClaim;
  }

  /** */
  private async convertRoleClaimEntry(entry: RoleClaimEntry): Promise<RoleClaim> {
    console.log("convertRoleClaimEntry() called", entry)
    let roleClaim = {
      subject: serializeHash(entry.subject),
      membraneIndex: entry.membraneIndex,
      role: await this.pullRole(entry.roleEh),
      membraneClaim: await this.pullMembraneCrossedClaim(entry.membraneClaimEh),

    };
    console.log("convertRoleClaimEntry() result", roleClaim)
    return roleClaim;
  }


  /** */
  private async pullThreshold(eh: EntryHash): Promise<MembraneThresholdEntry> {
    console.log("pullThreshold() called", eh)
    let thB64 = serializeHash(eh)
    const maybeThreshold = await this.bridge.getThreshold(eh)
    if (!maybeThreshold) {
      console.warn("pullThreshold() Failed. Can't find Threshold at " + thB64)
      return Promise.reject("pullThreshold() Failed. Can't find Threshold at " + thB64);
    }
    this.thresholdStore[thB64] = maybeThreshold!
    return maybeThreshold;
  }


  /** */
  private async pullMembrane(eh: EntryHash): Promise<Membrane> {
    console.log("pullMembrane() called", eh)
    let b64 = serializeHash(eh)
    const maybeEntry = await this.bridge.getMembrane(eh)
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
    console.log("pullMembraneCrossedClaim() called", eh)
    let b64 = serializeHash(eh)
    const maybeEntry = await this.bridge.getMembraneCrossedClaim(eh)
    if (!maybeEntry) {
      console.warn("pullMembraneCrossedClaim() Failed. Can't find Membrane at " + b64)
      return Promise.reject("pullMembraneCrossedClaim() Failed. Can't find Membrane at " + b64);
    }
    const claim = await this.convertMembraneCrossedClaimEntry(maybeEntry!)
    return claim;
  }


  /** */
  private async pullRole(eh: EntryHash): Promise<MembraneRole> {
    console.log("pullRole() called", eh)
    let b64 = serializeHash(eh)
    const maybeEntry = await this.bridge.getRole(eh)
    if (!maybeEntry) {
      console.warn("pullRole() Failed. Can't find Role at " + b64)
      return Promise.reject("pullRole() Failed. Can't find Role at " + b64);
    }
    const role = await this.convertRoleEntry(maybeEntry!)
    this.roleStore[b64] = role
    return role;
  }


  /** */
  async pullAllFromDht() {
    /** Get Thresholds */
    const thresholdEntries = await this.bridge.getAllThresholds();
    for (const [eh, typed] of thresholdEntries) {
      const b64 = serializeHash(eh);
      this.thresholdStore[b64] = typed
    }
    console.log({thresholdStore: this.thresholdStore})

    /** Get Membranes */
    const membraneEntries = await this.bridge.getAllMembranes();
    //console.log("membraneEntries:", membraneEntries)
    for (const [eh, membraneEntry] of membraneEntries) {
      const b64 = serializeHash(eh);
      const membrane = await this.convertMembraneEntry(membraneEntry)
      this.membraneStore[b64] = membrane
    }
    console.log({membraneStore: this.membraneStore})

    /** Get Roles */
    const roleEntries = await this.bridge.getAllRoles();
    //console.log("roleEntries:", roleEntries)
    for (const [eh, roleEntry] of roleEntries) {
      const b64 = serializeHash(eh);
      const role = await this.convertRoleEntry(roleEntry);
      this.roleStore[b64] = role
    }
    console.log({roleStore: this.roleStore})
  }


  /** */
  async pullMyClaims() {
    /** Role Claims */
    const myRoleClaims = await this.bridge.myClaimedRoles();
    let store: Dictionary<RoleClaim> = {}
    for (const [eh, entry] of myRoleClaims) {
      const b64 = serializeHash(eh);
      const claim = await this.convertRoleClaimEntry(entry);
      store[b64] = claim
    }
    this.myRoleClaimsStore = store;
    console.log("pullMyClaims() myRoleClaimsStore:", this.myRoleClaimsStore)
    /** Membrane Claims */
    const myMembraneClaims = await this.bridge.myClaimedMembranes();
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
    return this.bridge.publishRole(role);
  }


  /** */
  async createMembrane(ehs: EntryHashB64[]): Promise<EntryHash> {
    const thresholdEhs: EntryHash[] = Object.values(ehs).map((ehb64) => deserializeHash(ehb64));
    const membrane: MembraneEntry = {
      thresholdEhs,
    };
    return this.bridge.publishMembrane(membrane);
  }


  /** */
  async createVouchThreshold(requiredCount: number, byRole: string, forRole: string): Promise<EntryHash> {
    const typed: VouchThreshold = {
      requiredCount, byRole, forRole
    };
    return this.bridge.publishVouchThreshold(typed);
  }


  /** */
  async createCreateEntryCountThreshold(entryType: MyAppEntryType, requiredCount: number): Promise<EntryHash> {
    const typed: CreateEntryCountThreshold = {
      entryType: entryType,
      requiredCount: requiredCount,
    };
    return this.bridge.publishCreateEntryCountThreshold(typed);
  }



}
