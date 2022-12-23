import {EntryHashB64, ActionHashB64, AgentPubKeyB64, Dictionary} from '@holochain-open-dev/core-types';
import {AgentPubKey, decodeHashFromBase64, encodeHashToBase64, EntryHash} from "@holochain/client";
import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {MembranesProxy} from "../bindings/membranes.proxy";
import {
  CreateEntryCountThreshold,
  Membrane,
  MembraneCrossedClaim,
  MembraneRole,
  MembraneThreshold,
  MembraneThresholdVariantCreateEntryCount, MembraneThresholdVariantVouch,
  MyAppEntryType,
  RoleClaim,
  Vouch,
  VouchThreshold
} from "../bindings/membranes.types";
import {
  TypedMembrane,
  TypedMembraneCrossedClaim,
  TypedMembraneRole,
  MembranesPerspective, TypedRoleClaim,
  TypedVouch, defaultPerspective
} from "./membranes.perspective";


/** Output a human-readable phrase out of a Threshold */
export function describe_threshold(th: MembraneThreshold, allZomeTypes: [string, boolean][][]): string {
  let desc = "<unknown>";
  if (th.hasOwnProperty('vouch')) {
    let typed = (th as any).vouch as VouchThreshold;
    desc = "Receive " + typed.requiredCount + " \"" + typed.forRole + "\" vouch(es) by a \"" + typed.byRole + "\""
    //console.log(desc)
    return desc;
  }
  if (th.hasOwnProperty('progenitor')) {
    return "Progenitor";
  }
  if (th.hasOwnProperty('createEntryCount')) {
    let typed = (th as any).createEntryCount as CreateEntryCountThreshold;
    const zomeTypes = allZomeTypes[typed.entryType.zomeIndex];
    //console.log({zomeTypes})
    const entryType = zomeTypes[typed.entryType.entryIndex]
    //console.log({entryType})
    //const entryType = typed.entryType.id
    desc = "Create " + typed.requiredCount  + " \"" + entryType[0] + "\" entries";
    return desc;
  }
  return desc;
}


/** */
// export function areThresholdEqual(first: MembraneThreshold, second: MembraneThreshold) : Boolean {
//   if (first.hasOwnProperty("entryType")) {
//     if (!second.hasOwnProperty("entryType")) return false;
//     const firstCreate = first as CreateEntryCountThreshold;
//     const secondCreate = second as CreateEntryCountThreshold;
//     return firstCreate.requiredCount == secondCreate.requiredCount && firstCreate.entryType == secondCreate.entryType;
//   }
//   const firstVouch = first as VouchThreshold;
//   const secondVouch = second as VouchThreshold;
//   return firstVouch == secondVouch;
// }


export function areThresholdEqual(first: MembraneThreshold, second: MembraneThreshold) : Boolean {
  if (first.hasOwnProperty("createEntryCount")) {
    if (!second.hasOwnProperty("createEntryCount")) return false;
    const firstCreate = (first as MembraneThresholdVariantCreateEntryCount).createEntryCount;
    const secondCreate = (second as MembraneThresholdVariantCreateEntryCount).createEntryCount;
    return firstCreate.requiredCount == secondCreate.requiredCount
        && firstCreate.entryType == secondCreate.entryType;
  }
  if (first.hasOwnProperty("vouch")) {
    if (!second.hasOwnProperty("vouch")) return false;
    const firstVouch = (first as MembraneThresholdVariantVouch).vouch;
    const secondVouch = (second as MembraneThresholdVariantVouch).vouch;
    return firstVouch == secondVouch;
  }

  if (first.hasOwnProperty("progenitor")) {
    if (!second.hasOwnProperty("progenitor")) return false;
  }
  return true;
}



/** */
export function areMembraneEqual(first: TypedMembrane, second: TypedMembrane) : Boolean {
  if (first.thresholds.length !== second.thresholds.length) return false;
  for(let i = 0; i< first.thresholds.length; i++) {
    if (!areThresholdEqual(first.thresholds[i], second.thresholds[i])) {
      return false;
    }
  }
  return true;
}


/**
 *
 */
export class MembranesZvm extends ZomeViewModel {

  static readonly ZOME_PROXY = MembranesProxy;
  get zomeProxy(): MembranesProxy {return this._zomeProxy as MembranesProxy;}


  /** -- ViewModel -- */

  /* */
  get perspective(): MembranesPerspective {
    return this._perspective;
  }

  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }


  /** */
  async probeAll() {
    await this.probeThresholds();
    await this.probeMembranes();
    const roleEntries = await this.probeRoles();
    await this.probeMyVouches(roleEntries);
    await this.probeMyClaims();
  }


  /** -- Perspective -- */

  private _perspective: MembranesPerspective = defaultPerspective();


  /** -- Methods -- */

  findMembrane(membrane: TypedMembrane): EntryHashB64 | undefined {
    //console.log("findMembrane() called", membrane);
    let result = Object.entries(this.perspective.membranes).find(([_ehb64, cur]) => {
      return areMembraneEqual(cur, membrane);
    })
    //console.log("findMembrane()", membrane, result)
    return result && result.length > 0? result[0] : undefined;
  }


  /** */
  private convertVouchEntry(entry: Vouch): TypedVouch {
    return {subject: encodeHashToBase64(entry.subject), forRole: entry.forRole};
  }


  /** */
  private async convertMembraneEntry(membraneEntry: Membrane): Promise<TypedMembrane> {
    //console.log("convertMembraneEntry() called", membraneEntry)
    let allThresholds = this.perspective.thresholds;
    let thresholds = []
    for (const thresholdEh of membraneEntry.thresholdEhs) {
      let maybeStoredThreshold = allThresholds[encodeHashToBase64(thresholdEh)];
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
  private async convertRoleEntry(entry: MembraneRole): Promise<TypedMembraneRole> {
    let allMembranes = this.perspective.membranes;
    let enteringMembranes = []
    for (const membraneEh of entry.enteringMembraneEhs) {
      let maybeStoredMembrane = allMembranes[encodeHashToBase64(membraneEh)];
      if (!maybeStoredMembrane) {
        maybeStoredMembrane = await this.pullMembrane(membraneEh);
      }
      enteringMembranes.push(maybeStoredMembrane)
    }
    return {name: entry.name, privileges: entry.privileges, enteringMembranes};
  }


  /** */
  private async convertMembraneCrossedClaimEntry(membraneClaimEntry: MembraneCrossedClaim): Promise<TypedMembraneCrossedClaim> {
    //console.log("convertMembraneCrossedClaimEntry() called", membraneClaimEntry)
    let membraneClaim = {
      proofs: membraneClaimEntry.proofs,
      subject: encodeHashToBase64(membraneClaimEntry.subject),
      membrane: await this.pullMembrane(membraneClaimEntry.membraneEh),
    };
    //console.log("convertMembraneCrossedClaimEntry() result", membraneClaim)
    return membraneClaim;
  }

  /** */
  private async convertRoleClaimEntry(entry: RoleClaim): Promise<TypedRoleClaim> {
    //console.log("convertRoleClaimEntry() called", entry)
    let roleClaim: TypedRoleClaim = {
      subject: encodeHashToBase64(entry.subject),
      membraneIndex: entry.membraneIndex,
      role: await this.pullRole(entry.roleEh),
      membraneClaim: await this.pullMembraneCrossedClaim(entry.membraneClaimEh),

    };
    //console.log("convertRoleClaimEntry() result", roleClaim)
    return roleClaim;
  }


  /** */
  private async pullThreshold(eh: EntryHash): Promise<MembraneThreshold> {
    //console.log("pullThreshold() called", eh)
    let thB64 = encodeHashToBase64(eh)
    const maybeThreshold = await this.zomeProxy.getThreshold(eh)
    if (!maybeThreshold) {
      console.warn("pullThreshold() Failed. Can't find Threshold at " + thB64)
      return Promise.reject("pullThreshold() Failed. Can't find Threshold at " + thB64);
    }
    this._perspective.thresholds[thB64] = maybeThreshold!;
    return maybeThreshold;
  }


  /** */
  private async pullMembrane(eh: EntryHash): Promise<TypedMembrane> {
    //console.log("pullMembrane() called", eh)
    let b64 = encodeHashToBase64(eh)
    const maybeEntry = await this.zomeProxy.getMembrane(eh)
    if (!maybeEntry) {
      console.warn("pullMembrane() Failed. Can't find Membrane at " + b64)
      return Promise.reject("pullMembrane() Failed. Can't find Membrane at " + b64);
    }
    const membrane = await this.convertMembraneEntry(maybeEntry!)
    this._perspective.membranes[b64] = membrane!;
    return membrane;
  }


  /** */
  private async pullMembraneCrossedClaim(eh: EntryHash): Promise<TypedMembraneCrossedClaim> {
    //console.log("pullMembraneCrossedClaim() called", eh)
    let b64 = encodeHashToBase64(eh)
    const maybeEntry = await this.zomeProxy.getMembraneCrossedClaim(eh)
    if (!maybeEntry) {
      console.warn("pullMembraneCrossedClaim() Failed. Can't find Membrane at " + b64)
      return Promise.reject("pullMembraneCrossedClaim() Failed. Can't find Membrane at " + b64);
    }
    const claim = await this.convertMembraneCrossedClaimEntry(maybeEntry!)
    return claim;
  }


  /** */
  private async pullRole(eh: EntryHash): Promise<TypedMembraneRole> {
    //console.log("pullRole() called", eh)
    let b64 = encodeHashToBase64(eh)
    const maybeEntry = await this.zomeProxy.getRole(eh)
    if (!maybeEntry) {
      console.warn("pullRole() Failed. Can't find Role at " + b64)
      return Promise.reject("pullRole() Failed. Can't find Role at " + b64);
    }
    const role = await this.convertRoleEntry(maybeEntry!)
    this._perspective.roles[b64] = role!;
    return role;
  }


  /** */
  async probeThresholds() {
    const thresholdEntries = await this.zomeProxy.getAllThresholdsDetails();
    let thStore: Dictionary<MembraneThreshold> = {};
    for (const [eh, typed] of thresholdEntries) {
      const b64 = encodeHashToBase64(eh);
      thStore[b64] = typed;
    }
    this._perspective.thresholds = thStore!;
    this.notifySubscribers();
    //console.log({allThresholds: this._perspective.thresholds})
  }


  /** */
  async probeMembranes() {
    const membraneEntries = await this.zomeProxy.getAllMembranesDetails();
    //console.log("membraneEntries:", membraneEntries)
    let membraneStore: Dictionary<TypedMembrane> = {};
    for (const [eh, membraneEntry] of membraneEntries) {
      const b64 = encodeHashToBase64(eh);
      const membrane = await this.convertMembraneEntry(membraneEntry)
      membraneStore[b64] = membrane;
    }
    this._perspective.membranes = membraneStore!;
    this.notifySubscribers();
    //console.log({allMembranes: this._perspective.membranes})
  }


  /** */
  async probeRoles(): Promise<[EntryHash, MembraneRole][]> {
    const roleEntries = await this.zomeProxy.getAllRolesDetails();
    //console.log("roleEntries:", roleEntries)
    let roleStore: Dictionary<TypedMembraneRole> = {};
    for (const [eh, roleEntry] of roleEntries) {
      const b64 = encodeHashToBase64(eh);
      const role = await this.convertRoleEntry(roleEntry);
      roleStore[b64] = role;
    }
    this._perspective.roles = roleStore!;
    this.notifySubscribers();
    //console.log({allRoles: this._perspective.roles})
    return roleEntries;
  }


  /** */
  async probeMyVouches(roleEntries: [EntryHash, MembraneRole][]) {
    for (const [eh, roleEntry] of roleEntries) {
      const emittedEhs = await this.zomeProxy.getMyEmittedVouches(roleEntry.name);
      const receivedPairs: [EntryHash, AgentPubKey][] = await this.zomeProxy.getMyReceivedVouches(roleEntry.name);
      /* */
      let emitted: TypedVouch[] = [];
      for (const eh of emittedEhs) {
        const vouch = await this.zomeProxy.getVouch(eh);
        if (vouch) {
          emitted.push(this.convertVouchEntry(vouch))
        }
      }
      /* */
      let received: [TypedVouch, AgentPubKeyB64][] = [];
      for (const [eh, author] of receivedPairs) {
        const vouch = await this.zomeProxy.getVouch(eh);
        if (vouch) {
          const pair: [TypedVouch, AgentPubKeyB64] = [this.convertVouchEntry(vouch), encodeHashToBase64(author)]
          received.push(pair)
        }
      }
      /* */
      this._perspective.myVouches[roleEntry.name] = [emitted, received];
    }
    this.notifySubscribers();
  }


  /** */
  async claimAll() {
    await this.zomeProxy.claimAllRoles();
    this.probeMyClaims();
  }


  /** */
  async probeMyClaims() {
    /** Role Claims */
    const myRoleClaims = await this.zomeProxy.getMyRoleClaimsDetails();
    let store: Dictionary<TypedRoleClaim> = {}
    for (const [eh, entry] of myRoleClaims) {
      const b64 = encodeHashToBase64(eh);
      const claim = await this.convertRoleClaimEntry(entry);
      store[b64] = claim
    }
    this._perspective.myRoleClaims = store;
    //console.log("pullMyClaims() myRoleClaims:", store)
    /** Membrane Claims */
    const myMembraneClaims = await this.zomeProxy.getMyMembraneClaimsDetails();
    let membraneClaimStore: Dictionary<TypedMembraneCrossedClaim> = {}
    for (const [eh, entry] of myMembraneClaims) {
      const b64 = encodeHashToBase64(eh);
      const claim = await this.convertMembraneCrossedClaimEntry(entry);
      membraneClaimStore[b64] = claim
    }
    this._perspective.myMembraneClaims = membraneClaimStore;
    this.notifySubscribers();
    //console.log("pullMyClaims() myMembraneClaims:", membraneClaimStore)
  }


  /** */
  async createRole(name: string, membraneEhs: EntryHashB64[]): Promise<EntryHash> {
    const enteringMembraneEhs: EntryHash[] = Object.values(membraneEhs).map((ehb64) => decodeHashFromBase64(ehb64));
    const role: MembraneRole = {
      name,
      privileges: [],
      enteringMembraneEhs,
    };
    const res = await this.zomeProxy.publishRole(role);
    this.probeRoles();
    return res;
  }


  /** */
  async createMembrane(ehs: EntryHashB64[]): Promise<EntryHash> {
    const thresholdEhs: EntryHash[] = Object.values(ehs).map((ehb64) => decodeHashFromBase64(ehb64));
    const membrane: Membrane = {
      thresholdEhs,
    };
    let res = await this.zomeProxy.publishMembrane(membrane);
    this.probeMembranes();
    return res;
  }


  /** */
  async createVouchThreshold(requiredCount: number, byRole: string, forRole: string): Promise<EntryHash> {
    const typed: VouchThreshold = {
      requiredCount, byRole, forRole
    };
    let res = await this.zomeProxy.publishVouchThreshold(typed);
    this.probeThresholds();
    return res;
  }


  /** */
  async createCreateEntryCountThreshold(entryType: MyAppEntryType, requiredCount: number): Promise<EntryHash> {
    const typed: CreateEntryCountThreshold = {
      entryType: entryType,
      requiredCount: requiredCount,
    };
    let res = await this.zomeProxy.publishCreateEntryCountThreshold(typed);
    this.probeThresholds();
    return res;
  }


  async vouchAgent(agent: AgentPubKeyB64, forRole: string): Promise<EntryHash> {
    const res = await this.zomeProxy.publishVouch({subject: decodeHashFromBase64(agent), forRole});
    this.probeAll();
    return res;
  }


  /* */
  async getVouchAuthor(vouch: TypedVouch): Promise<AgentPubKeyB64> {
    let entry: Vouch = {subject: decodeHashFromBase64(vouch.subject), forRole: vouch.forRole};
    let res = await this.zomeProxy.getVouchAuthor(entry);
    return encodeHashToBase64(res);
  }


  /** */
  async getCreateCount(agent: AgentPubKeyB64, entryType: MyAppEntryType): Promise<number> {
    return this.zomeProxy.getCreateCount({subject: decodeHashFromBase64(agent), entryType});
  }

}
