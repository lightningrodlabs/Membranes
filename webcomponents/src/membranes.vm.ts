import {EntryHashB64, ActionHashB64, AgentPubKeyB64, Dictionary} from '@holochain-open-dev/core-types';
import {AgentPubKey, EntryHash} from "@holochain/client";
import {deserializeHash, serializeHash} from "@holochain-open-dev/utils";
import {DnaClient, ZomeViewModel} from "@ddd-qc/dna-client";
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
import {createContext} from "@lit-labs/context";


/** Output a human-readable phrase out of a Threshold */
export function describe_threshold(th: MembraneThresholdEntry, allZomeTypes: [string, boolean][][]): string {
  let desc = "";
  if (th.hasOwnProperty('vouch')) {
    let typed = (th as any).vouch as VouchThreshold;
    desc = "Receive " + typed.requiredCount  + " \"" + typed.forRole  + "\" vouch(es) by a \"" + typed.byRole + "\""
    //console.log(desc)
  } else {
    let typed = (th as any).createEntryCount as CreateEntryCountThreshold;
    const zomeTypes = allZomeTypes[typed.entryType.zomeId];
    //console.log({zomeTypes})
    const entryType = zomeTypes[typed.entryType.id]
    //console.log({entryType})
    //const entryType = typed.entryType.id
    desc = "Create " + typed.requiredCount  + " \"" + entryType[0] + "\" entries"
  }
  return desc;
}


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


/** */
export interface MembranesPerspective {
  /** EntryHashB64 -> <typed> */
  thresholds: Dictionary<MembraneThresholdEntry>,
  membranes: Dictionary<Membrane>,
  roles: Dictionary<MembraneRole>,
  myRoleClaims: Dictionary<RoleClaim>,
  myMembraneClaims: Dictionary<MembraneCrossedClaim>,
  /** RoleName -> [[emitted],[[received,author]]] */
  myVouches: Dictionary<[Vouch[], [Vouch, AgentPubKeyB64][]]>
}

const emptyPerspective: MembranesPerspective = {
  thresholds: {},
  membranes: {},
  roles: {},
  myRoleClaims: {},
  myMembraneClaims: {},
  myVouches: {},
}



/**
 *
 */
export class MembranesViewModel extends ZomeViewModel<MembranesPerspective, MembranesBridge> {
  /** Ctor */
  constructor(protected dnaClient: DnaClient) {
    super(new MembranesBridge(dnaClient));
  }

  static context = createContext<MembranesViewModel>('zome_view_model/agent_directory');
  getContext(): any {return MembranesViewModel.context}


  /** -- ZomeViewModel -- */
  private _perspective: MembranesPerspective = emptyPerspective

  /* */
  get perspective(): MembranesPerspective {
    return this._perspective;
  }

  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }


  /** -- Methods -- */

  findMembrane(membrane: Membrane): EntryHashB64 | undefined {
    //console.log("findMembrane() called", membrane);
    let result = Object.entries(this.perspective.membranes).find(([_ehb64, cur]) => {
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
    let allThresholds = this.perspective.thresholds;
    let thresholds = []
    for (const thresholdEh of membraneEntry.thresholdEhs) {
      let maybeStoredThreshold = allThresholds[serializeHash(thresholdEh)];
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
    let allMembranes = this.perspective.membranes;
    let enteringMembranes = []
    for (const membraneEh of entry.enteringMembraneEhs) {
      let maybeStoredMembrane = allMembranes[serializeHash(membraneEh)];
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
    this._perspective.thresholds[thB64] = maybeThreshold!;
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
    this._perspective.membranes[b64] = membrane!;
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
    this._perspective.roles[b64] = role!;
    return role;
  }


  /** */
  async pullAllThresholds() {
    const thresholdEntries = await this._bridge.getAllThresholds();
    let thStore: Dictionary<MembraneThresholdEntry> = {};
    for (const [eh, typed] of thresholdEntries) {
      const b64 = serializeHash(eh);
      thStore[b64] = typed;
    }
    this._perspective.thresholds = thStore!;
    this.notify();
    //console.log({allThresholds: this._perspective.thresholds})
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
    this._perspective.membranes = membraneStore!;
    this.notify();
    //console.log({allMembranes: this._perspective.membranes})
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
    this._perspective.roles = roleStore!;
    this.notify();
    //console.log({allRoles: this._perspective.roles})
    return roleEntries;
  }


  /** */
  async probeDht() {
    await this.pullAllThresholds();
    await this.pullAllMembranes();
    const roleEntries = await this.pullAllRoles();
    await this.pullAllMyVouches(roleEntries);
    await this.pullMyClaims();
  }


  /** */
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
      this._perspective.myVouches[roleEntry.name] = [emitted, received];
    }
    this.notify();
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
    this._perspective.myRoleClaims = store;
    //console.log("pullMyClaims() myRoleClaims:", store)
    /** Membrane Claims */
    const myMembraneClaims = await this._bridge.myClaimedMembranes();
    let membraneClaimStore: Dictionary<MembraneCrossedClaim> = {}
    for (const [eh, entry] of myMembraneClaims) {
      const b64 = serializeHash(eh);
      const claim = await this.convertMembraneCrossedClaimEntry(entry);
      membraneClaimStore[b64] = claim
    }
    this._perspective.myMembraneClaims = membraneClaimStore;
    this.notify();
    //console.log("pullMyClaims() myMembraneClaims:", membraneClaimStore)
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
    this.probeDht();
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
