import {
  encodeHashToBase64,
  EntryHash,
  EntryHashB64
} from "@holochain/client";
import {AgentId, EntryDef, EntryId, MyDictionary, ZomeViewModel} from "@ddd-qc/lit-happ";
import {MembranesProxy} from "../bindings/membranes.proxy";
import {
  Membrane,
  MembraneCrossedClaim,
  MembraneRole,
  MembraneThreshold,
  RoleClaim,
} from "../bindings/membranes.types";
import {
  TypedMembrane,
  TypedMembraneCrossedClaim,
  TypedMembraneRole,
  MembranesPerspective, TypedRoleClaim,
  defaultPerspective
} from "./membranes.perspective";
import {CreateEntryCountThreshold} from "../bindings/createEntryCount.types";
import { decode } from '@msgpack/msgpack';
import {VouchThreshold} from "../bindings/vouch.types";

// /** Output a human-readable phrase out of a Threshold */
// export function describe_threshold(th: MembraneThreshold, _allZomeTypes: [string, boolean][][]): string {
//   return th.typeName;
// }


/** Output a human-readable phrase out of a Threshold */
export function describe_threshold(th: MembraneThreshold, entryDefs: MyDictionary<MyDictionary<EntryDef>>): string {
  if (th.typeName == 'Vouch') {
    let typed = decode(th.data) as any as VouchThreshold;
    return "Get " + typed.requiredCount + " vouch(s) by \"" + typed.byRole + "\" for \"" + typed.forRole + "\"";

  }
  if (th.typeName == 'CreateEntryCount') {
    let typed = decode(th.data) as any as CreateEntryCountThreshold;
    const zomeTypes = Object.values(entryDefs)[typed.entryType.zomeIndex]!;
    //console.log({zomeTypes})
    const entryType = Object.values(zomeTypes)[typed.entryType.entryIndex]!;
    let entryName = "(cap)";
    if ("App" in entryType.id) {
        entryName = entryType.id.App;
    }

      //console.log({entryType})
    //const entryType = typed.entryType.id
    return "Create " + typed.requiredCount  + " \"" + entryName + "\" entries";
  }
  return th.typeName;
}




export function areThresholdEqual(first: MembraneThreshold, second: MembraneThreshold) : Boolean {
  return first.typeName == second.typeName && first.data == second.data;
}



/** */
export function areMembraneEqual(first: TypedMembrane, second: TypedMembrane) : boolean {
  if (first.thresholds.length !== second.thresholds.length) return false;
  for(let i = 0; i< first.thresholds.length; i++) {
    if (!areThresholdEqual(first.thresholds[i]!, second.thresholds[i]!)) {
      return false;
    }
  }
  return true;
}


/** Better way to catch and handle "throttled" error */
export function catchThrottled<T>(promise: Promise<T>): Promise<[undefined, T] | [Error]> {
    return promise
        .then(data => [undefined, data] as [undefined, T])
        .catch(error => {
            if (error.throttled) {
                return [error];
            }
            throw error;
        })
}


/** */
export class MembranesZvm extends ZomeViewModel {

  static override readonly ZOME_PROXY = MembranesProxy;
  get zomeProxy(): MembranesProxy {return this._zomeProxy as MembranesProxy;}


  /** -- ViewModel -- */

  /* */
  get perspective(): MembranesPerspective {
    return this._perspective;
  }

  /* */
  protected override hasChanged(): boolean {
    // TODO
    return true;
  }


  /** */
  override async probeAllInner(): Promise<void> {
    await this.probeThresholdTypes();
    await this.probeThresholds();
    await this.probeMembranes();
    await this.probeMyClaims();
    await this.probeRoles();
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
  private async convertMembraneEntry(membraneEntry: Membrane): Promise<TypedMembrane> {
    //console.log("convertMembraneEntry() called", membraneEntry)
    let allThresholds = this.perspective.thresholds;
    let thresholds = []
    for (const thresholdEh of membraneEntry.thresholdEhs) {
        const eh = new EntryId(thresholdEh);
      let maybeStoredThreshold = allThresholds[eh.b64];
      if (!maybeStoredThreshold) {
        maybeStoredThreshold = await this.pullThreshold(eh);
      }
      thresholds.push(maybeStoredThreshold)
    }
    return {thresholds};
  }


  /** */
  private async convertRoleEntry(entry: MembraneRole): Promise<TypedMembraneRole> {
    let allMembranes = this.perspective.membranes;
    let enteringMembranes = []
    for (const membraneEh of entry.enteringMembraneEhs) {
      const eh = new EntryId(membraneEh);
      let maybeStoredMembrane = allMembranes[eh.b64];
      if (!maybeStoredMembrane) {
        maybeStoredMembrane = await this.pullMembrane(eh);
      }
      enteringMembranes.push(maybeStoredMembrane)
    }
    return {name: entry.name, privileges: entry.privileges, enteringMembranes};
  }


  /** */
  private async convertMembraneCrossedClaimEntry(membraneClaimEntry: MembraneCrossedClaim): Promise<TypedMembraneCrossedClaim> {
    //console.log("convertMembraneCrossedClaimEntry() called", membraneClaimEntry)
    // TODO: Refactor and use Promise.all() instead
    let proofs = [];
    for (const proofAh of Object.values(membraneClaimEntry.proofAhs)) {
      const res = await this.zomeProxy.getProof(proofAh);
      if (res == null) continue; // throw Error("Proof not found");
      proofs.push(res);
    }
    return {
        proofs,
        subject: new AgentId(membraneClaimEntry.subject),
        membrane: await this.pullMembrane(new EntryId(membraneClaimEntry.membraneEh)),
    } as TypedMembraneCrossedClaim;
  }


  /** */
  private async convertRoleClaimEntry(entry: RoleClaim): Promise<TypedRoleClaim> {
    //console.log("convertRoleClaimEntry() called", entry)
    return {
        subject: new AgentId(entry.subject),
        membraneIndex: entry.membraneIndex,
        role: await this.pullRole(new EntryId(entry.roleEh)),
        membraneClaim: await this.pullMembraneCrossedClaim(new EntryId(entry.membraneClaimEh)),
    }
  }


  /** */
  private async pullThreshold(eh: EntryId): Promise<MembraneThreshold> {
    //console.log("pullThreshold() called", eh)
    const maybeThreshold = await this.zomeProxy.getThreshold(eh.hash)
    if (!maybeThreshold) {
      console.warn("pullThreshold() Failed. Can't find Threshold at " + eh.short)
      return Promise.reject("pullThreshold() Failed. Can't find Threshold at " + eh.b64);
    }
    this._perspective.thresholds[eh.b64] = maybeThreshold!;
    return maybeThreshold;
  }


  /** */
  private async pullMembrane(eh: EntryId): Promise<TypedMembrane> {
    //console.log("pullMembrane() called", eh)
    const maybeEntry = await this.zomeProxy.getMembrane(eh.hash)
    if (!maybeEntry) {
      console.warn("pullMembrane() Failed. Can't find Membrane at " + eh.b64)
      return Promise.reject("pullMembrane() Failed. Can't find Membrane at " + eh.b64);
    }
    const membrane = await this.convertMembraneEntry(maybeEntry!)
    this._perspective.membranes[eh.b64] = membrane!;
    return membrane;
  }


  /** */
  private async pullMembraneCrossedClaim(eh: EntryId): Promise<TypedMembraneCrossedClaim> {
    //console.log("pullMembraneCrossedClaim() called", eh)
    const maybeEntry = await this.zomeProxy.getMembraneCrossedClaim(eh.hash)
    if (!maybeEntry) {
      console.warn("pullMembraneCrossedClaim() Failed. Can't find Membrane at " + eh.b64)
      return Promise.reject("pullMembraneCrossedClaim() Failed. Can't find Membrane at " + eh.b64);
    }
    const claim = await this.convertMembraneCrossedClaimEntry(maybeEntry!)
    return claim;
  }


  /** */
  private async pullRole(eh: EntryId): Promise<TypedMembraneRole> {
    //console.log("pullRole() called", eh)
    const maybeEntry = await this.zomeProxy.getRole(eh.hash)
    if (!maybeEntry) {
      console.warn("pullRole() Failed. Can't find Role at " + eh.b64)
      return Promise.reject("pullRole() Failed. Can't find Role at " + eh.b64);
    }
    const role = await this.convertRoleEntry(maybeEntry!)
    this._perspective.roles[eh.b64] = role!;
    return role;
  }


  /** */
  async probeThresholdTypes() {
    const thresholdTypes = await this.zomeProxy.getAllRegisteredThresholdTypes();
    console.log("probeThresholdTypes()", thresholdTypes);
    let thStore: Record<string, string> = {};
    for (const tt of thresholdTypes) {
      thStore[tt.name] = tt.zomeName;
    }
    this._perspective.thresholdTypes = thStore!;
    this.notifySubscribers();
    //console.log({allThresholds: this._perspective.thresholds})
  }


  /** */
  async probeThresholds() {
    const thresholdEntries = await this.zomeProxy.getAllThresholdsDetails();
    let thStore: Record<string, MembraneThreshold> = {};
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
    let membraneStore: Record<string, TypedMembrane> = {};
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
    let roleStore: Record<string, TypedMembraneRole> = {};
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
  async claimAll() {
    let res = await this.zomeProxy.claimAllRoles();
    console.debug("claimAll() res:", res)
    await this.probeMyClaims();
  }


  /** */
  async probeMyClaims() {
    /** Role Claims */
    const [throttleError, myRoleClaims] = await catchThrottled(this.zomeProxy.getMyRoleClaimsDetails());
      if (throttleError) {
          return;
      }
    let store: Record<string, TypedRoleClaim> = {}
    for (const [eh, entry] of myRoleClaims) {
      const b64 = encodeHashToBase64(eh);
      store[b64] = await this.convertRoleClaimEntry(entry);
    }
    this._perspective.myRoleClaims = store;
    console.debug("pullMyClaims() myRoleClaims:", store)
    /** Membrane Claims */
    const myMembraneClaims = await this.zomeProxy.getMyMembraneClaimsDetails();
    let membraneClaimStore: Record<string, TypedMembraneCrossedClaim> = {}
    for (const [eh, entry] of myMembraneClaims) {
      const b64 = encodeHashToBase64(eh);
      membraneClaimStore[b64] = await this.convertMembraneCrossedClaimEntry(entry);
    }
    this._perspective.myMembraneClaims = membraneClaimStore;
    this.notifySubscribers();
    console.debug("pullMyClaims() myMembraneClaims:", membraneClaimStore)
  }


  /** */
  async createRole(name: string, membraneEhs: EntryId[]): Promise<EntryHash> {
    const enteringMembraneEhs: EntryHash[] = Object.values(membraneEhs).map((eh) => eh.hash);
    const role: MembraneRole = {
      name,
      privileges: [],
      enteringMembraneEhs,
    };
    const res = await this.zomeProxy.publishRole(role);
    await this.probeRoles();
    return res;
  }


  /** */
  async createMembrane(ehs: EntryId[]): Promise<EntryHash> {
    const thresholdEhs: EntryHash[] = Object.values(ehs).map((eh) => eh.hash);
    const membrane: Membrane = {
      thresholdEhs,
    };
    let res = await this.zomeProxy.publishMembrane(membrane);
    await this.probeMembranes();
    return res;
  }
}
