import {ZomeBridge} from "@ddd-qc/dna-client";
import { EntryHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { SignedActionHashed, EntryHash, AgentPubKey} from "@holochain/client";
import {
  CreateEntryCountThreshold, GetCreateCountInput,
  MembraneCrossedClaimEntry,
  MembraneEntry,
  MembraneRoleEntry,
  MembraneThresholdEntry,
  RoleClaimEntry, VouchEntry, VouchThreshold
} from "./membranes.types";


/** */
export class MembranesBridge extends ZomeBridge {
   zomeName = "membranes"

  /** Indexes */

  async getAllMembranes(): Promise<[EntryHash, MembraneEntry][]> {
    return this.call('get_all_membranes_details', null);
  }

  async getAllRoles(): Promise<[EntryHash, MembraneRoleEntry][]> {
    return this.call('get_all_roles_details', null);
  }

  async getAllThresholds(): Promise<[EntryHash, MembraneThresholdEntry][]> {
    return this.call('get_all_thresholds_details', null);
  }


  /** Membranes */

  async publishMembrane(entry: MembraneEntry): Promise<EntryHash> {
    return this.call('publish_membrane', entry);
  }

  async myClaimedMembranes(): Promise<[EntryHash, MembraneCrossedClaimEntry][]> {
    return this.call('get_my_membrane_claims_details', null);
  }

  async hasAgentCrossedMembrane(subject: AgentPubKeyB64, membraneEh: EntryHashB64): Promise<EntryHashB64 | null> {
    return this.call('has_crossed_membrane', {subject, membraneEh});
  }

  async claimMembrane(subject: AgentPubKeyB64, membraneEh: EntryHashB64): Promise<EntryHashB64 | null> {
    return this.call('claim_membrane', {subject, membraneEh});
  }


  async getMembrane(eh: EntryHash): Promise<MembraneEntry | null> {
    return this.call('get_membrane', eh);
  }

  async getMembraneCrossedClaim(eh: EntryHash): Promise<MembraneCrossedClaimEntry | null> {
    return this.call('get_membrane_crossed_claim', eh);
  }

  /** Roles */

  async myClaimedRoles(): Promise<[EntryHash, RoleClaimEntry][]> {
    return this.call('get_my_role_claims_details', null);
  }


  async hasRole(subject: AgentPubKeyB64, roleEh: EntryHashB64): Promise<SignedActionHashed | null> {
    return this.call('has_role', {subject, roleEh});
  }

  async doIHaveRole(roleEh: EntryHashB64): Promise<EntryHashB64 | null> {
    return this.call('do_i_have_role', roleEh);
  }

  async claimRole(subject: AgentPubKeyB64, roleEh: EntryHashB64, membraneIndex: number): Promise<EntryHashB64 | null> {
    return this.call('claim_role', {subject, roleEh, membraneIndex});
  }

  async claimRoleByName(name: string): Promise<EntryHashB64 | null> {
    return this.call('claim_role_by_name', name);
  }

  async claimAllRoles(): Promise<number> {
    return this.call('claim_all_roles', null);
  }

  async publishRole(role: MembraneRoleEntry): Promise<EntryHash> {
    return this.call('publish_role', role);
  }

  async getRole(eh: EntryHash): Promise<MembraneRoleEntry | null> {
    return this.call('get_role', eh);
  }

  async getRoleByName(name: string): Promise<MembraneRoleEntry | null> {
    return this.call('get_role_by_name', name);
  }


  /** Thresholds */

  async publishVouchThreshold(typed: VouchThreshold): Promise<EntryHash> {
    return this.call('publish_vouchThreshold', typed);
  }

  async publishCreateEntryCountThreshold(typed: CreateEntryCountThreshold): Promise<EntryHash> {
    console.log({typed})
    return this.call('publish_createEntryCountThreshold', typed);
  }

  async getThreshold(thresholdEh: EntryHash): Promise<MembraneThresholdEntry | null> {
    return this.call('get_threshold', thresholdEh);
  }


  async getCreateCount(input: GetCreateCountInput): Promise<number> {
    return this.call('get_create_count', input);
  }


  /** Vouch */

  async getVouchAuthor(vouch: VouchEntry): Promise<AgentPubKey> {
    return this.call('get_vouch_author', vouch);
  }

  async publishVouch(typed: VouchEntry): Promise<EntryHash> {
    return this.call('publish_vouch', typed);
  }

  async getVouch(eh: EntryHash): Promise<VouchEntry | null> {
    return this.call('get_vouch', eh);
  }

  async getMyEmittedVouches(maybeRole: string | null): Promise<EntryHash[]> {
    return this.call('get_my_emitted_vouches', maybeRole);
  }

  async getMyReceivedVouches(maybeRole: string | null): Promise<[EntryHash, AgentPubKey][]> {
    return this.call('get_my_received_vouches', maybeRole);
  }

}
