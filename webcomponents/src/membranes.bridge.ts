import {AgnosticClient} from '@holochain-open-dev/cell-client';
import { EntryHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import {CellId, SignedActionHashed, EntryHash} from "@holochain/client";
import {createContext} from "@lit-labs/context";
import {
  MembraneCrossedClaimEntry,
  MembraneEntry,
  MembraneRoleEntry,
  MembraneThresholdEntry,
  RoleClaimEntry
} from "./membranes.types";

/** */
export class MembranesBridge {

  /** Ctor */
  constructor(public agnosticClient: AgnosticClient, public cellId: CellId /*, protected roleId: string*/) {}


  /** Zome API */


  /** Indexes */

  async getAllMembranes(): Promise<[EntryHash, MembraneEntry][]> {
    return this.callZome('get_all_membranes_details', null);
  }

  async getAllRoles(): Promise<[EntryHash, MembraneRoleEntry][]> {
    return this.callZome('get_all_roles_details', null);
  }

  async getAllThresholds(): Promise<[EntryHash, MembraneThresholdEntry][]> {
    return this.callZome('get_all_thresholds_details', null);
  }


  /** Membranes */

  async publishMembrane(entry: MembraneEntry): Promise<EntryHash> {
    return this.callZome('publish_membrane', entry);
  }

  async myClaimedMembranes(): Promise<[EntryHash, MembraneCrossedClaimEntry][]> {
    return this.callZome('get_my_membrane_claims_details', null);
  }

  async hasAgentCrossedMembrane(subject: AgentPubKeyB64, membraneEh: EntryHashB64): Promise<EntryHashB64 | null> {
    return this.callZome('has_crossed_membrane', {subject, membraneEh});
  }

  async claimMembrane(subject: AgentPubKeyB64, membraneEh: EntryHashB64): Promise<EntryHashB64 | null> {
    return this.callZome('claim_membrane', {subject, membraneEh});
  }


  async getMembrane(eh: EntryHash): Promise<MembraneEntry | null> {
    return this.callZome('get_membrane', eh);
  }

  async getMembraneCrossedClaim(eh: EntryHash): Promise<MembraneCrossedClaimEntry | null> {
    return this.callZome('get_membrane_crossed_claim', eh);
  }

  /** Roles */

  async myClaimedRoles(): Promise<[EntryHash, RoleClaimEntry][]> {
    return this.callZome('get_my_role_claims_details', null);
  }


  async hasRole(subject: AgentPubKeyB64, roleEh: EntryHashB64): Promise<SignedActionHashed | null> {
    return this.callZome('has_role', {subject, roleEh});
  }

  async doIHaveRole(roleEh: EntryHashB64): Promise<EntryHashB64 | null> {
    return this.callZome('do_i_have_role', roleEh);
  }

  async claimRole(subject: AgentPubKeyB64, roleEh: EntryHashB64, membraneIndex: number): Promise<EntryHashB64 | null> {
    return this.callZome('claim_role', {subject, roleEh, membraneIndex});
  }

  async publishRole(role: MembraneRoleEntry): Promise<EntryHash> {
    return this.callZome('publish_role', role);
  }

  async getRole(eh: EntryHash): Promise<MembraneRoleEntry | null> {
    return this.callZome('get_role', eh);
  }

  async getRoleByName(name: string): Promise<MembraneRoleEntry | null> {
    return this.callZome('get_role_by_name', name);
  }


  /** Thresholds */

  async getThreshold(thresholdEh: EntryHash): Promise<MembraneThresholdEntry | null> {
    return this.callZome('get_threshold', thresholdEh);
  }

  /** Private */

  /** */
  private callZome(fn_name: string, payload: any): Promise<any> {
    //console.log("callZome: membranes." + fn_name + "() ", payload)
    //console.info({payload})
    try {
      const result = this.agnosticClient.callZome(this.cellId, "membranes", fn_name, payload, 10 * 1000);
      //console.log("callZome: membranes." + fn_name + "() result")
      //console.info({result})
      return result;
    } catch (e) {
      console.error("Calling zome membranes." + fn_name + "() failed: ")
      console.error({e})
    }
    return Promise.reject("callZome failed")
  }



}
