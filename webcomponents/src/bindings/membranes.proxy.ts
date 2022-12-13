/* This file is generated by zits. Do not edit manually */

import {Vouch, MembraneCrossedClaim, RoleClaim, MembraneRole, Membrane, MembraneThreshold, MyAppEntryType, CreateEntryCountThreshold, VouchThreshold, ThresholdReachedProof, CrudType, Privilege, GetCreateCountInput, HasRoleInput, ClaimRoleInput, MembraneInput, MembranesEntry, MembraneZomeProperties, } from './membranes';
import {
/** Types */
HoloHash,
AgentPubKey,
DnaHash,
WasmHash,
EntryHash,
ActionHash,
AnyDhtHash,
KitsuneAgent,
KitsuneSpace,
InstalledAppId,
Signature,
CellId,
DnaProperties,
RoleId,
InstalledCell,
Timestamp,
HoloHashed,
/** Action */
SignedActionHashed,
ActionHashed,
ActionType,
Action,
NewEntryAction,
Dna,
AgentValidationPkg,
InitZomesComplete,
CreateLink,
DeleteLink,
OpenChain,
CloseChain,
Update,
Delete,
Create,
/** Capabilities */
CapSecret,
CapClaim,
ZomeCallCapGrant,
CapAccess,
CapGrant,
/** CounterSigning */
//CounterSigningSessionData,
//PreflightRequest,
//CounterSigningSessionTimes,
//ActionBase,
//CounterSigningAgents,
//PreflightBytes,
//Role,
//CountersigningAgentState,
/** DhtOps */
DhtOpType,
DhtOp,
getDhtOpType,
getDhtOpAction,
getDhtOpEntry,
getDhtOpSignature,
/** Entry */
EntryVisibility,
AppEntryType,
EntryType,
EntryContent,
Entry,
/** Record */
Record,
RecordEntry,
/** admin types */
ZomeName,
MembraneProof,
ZomeDefinition,
IntegrityZome,
CoordinatorZome,
DnaDefinition,
ResourceBytes,
ResourceMap,
CellProvisioning,
HoloHashB64,
DnaVersionSpec,
DnaVersionFlexible,
NetworkSeed,
ZomeLocation,
   } from '@holochain/client';

import {
// Common
Dictionary,
EntryHashB64,
ActionHashB64,
DhtOpHashB64,
DnaHashB64,
AgentPubKeyB64,
AnyDhtHashB64,
DhtOpHash,
// DnaFile
DnaFile,
DnaDef,
Zomes,
WasmCode,
// entry-details
EntryDetails,
RecordDetails,
Details,
DetailsType,
EntryDhtStatus,
// Validation
ValidationStatus,
ValidationReceipt,
   } from '@holochain-open-dev/core-types';

import {ZomeProxy} from '@ddd-qc/lit-happ';

/**
 *
 */
export class MembranesProxy extends ZomeProxy {
  static readonly DEFAULT_ZOME_NAME = "membranes"
 

  async getAllMembranesDetails(): Promise<[EntryHash, Membrane, ][]> {
  	return this.call('get_all_membranes_details', null);
  }

  async getAllRoles(): Promise<[EntryHashB64, string, ][]> {
  	return this.call('get_all_roles', null);
  }

  async getAllRolesDetails(): Promise<[EntryHash, MembraneRole, ][]> {
  	return this.call('get_all_roles_details', null);
  }

  async getRoleByName(requestedName: string): Promise<MembraneRole | null> {
  	return this.call('get_role_by_name', requestedName);
  }

  async getAllThresholdsDetails(): Promise<[EntryHash, MembraneThreshold, ][]> {
  	return this.call('get_all_thresholds_details', null);
  }


  async claimAllMembranes(): Promise<number> {
  	return this.call('claim_all_membranes', null);
  }

  async claimMembrane(input: MembraneInput): Promise<EntryHashB64 | null> {
  	return this.call('claim_membrane', input);
  }

  async getCreateCount(input: GetCreateCountInput): Promise<number> {
  	return this.call('get_create_count', input);
  }

  async claimRoleWithMembrane(input: ClaimRoleInput): Promise<EntryHashB64 | null> {
  	return this.call('claim_role_with_membrane', input);
  }

  async claimRoleByName(roleName: string): Promise<EntryHashB64 | null> {
  	return this.call('claim_role_by_name', roleName);
  }

  async claimAllRoles(): Promise<number> {
  	return this.call('claim_all_roles', null);
  }

  async getVouch(eh: EntryHash): Promise<Vouch | null> {
  	return this.call('get_vouch', eh);
  }

  async getThreshold(eh: EntryHash): Promise<MembraneThreshold | null> {
  	return this.call('get_threshold', eh);
  }

  async getMembrane(eh: EntryHash): Promise<Membrane | null> {
  	return this.call('get_membrane', eh);
  }

  async getRole(eh: EntryHash): Promise<MembraneRole | null> {
  	return this.call('get_role', eh);
  }

  async getMembraneCrossedClaim(eh: EntryHash): Promise<MembraneCrossedClaim | null> {
  	return this.call('get_membrane_crossed_claim', eh);
  }

  async getMyRoleClaimsDetails(): Promise<[EntryHash, RoleClaim, ][]> {
  	return this.call('get_my_role_claims_details', null);
  }

  async getMyMembraneClaimsDetails(): Promise<[EntryHash, MembraneCrossedClaim, ][]> {
  	return this.call('get_my_membrane_claims_details', null);
  }

  async hasCrossedMembrane(input: MembraneInput): Promise<EntryHashB64 | null> {
  	return this.call('has_crossed_membrane', input);
  }

  async dnaInfoHack(): Promise<ZomeName[]> {
  	return this.call('dna_info_hack', null);
  }

  async echoAppEntryType(entryType: AppEntryType): Promise<void> {
  	return this.call('echo_app_entry_type', entryType);
  }

  async getVouchAuthor(typed: Vouch): Promise<AgentPubKey> {
  	return this.call('get_vouch_author', typed);
  }

  async publishVouchThreshold(vouchThreshold: VouchThreshold): Promise<EntryHash> {
  	return this.call('publish_vouchThreshold', vouchThreshold);
  }

  async publishCreateEntryCountThreshold(createThreshold: CreateEntryCountThreshold): Promise<EntryHash> {
  	return this.call('publish_createEntryCountThreshold', createThreshold);
  }

  async publishMembrane(membrane: Membrane): Promise<EntryHash> {
  	return this.call('publish_membrane', membrane);
  }

  async publishRole(role: MembraneRole): Promise<EntryHash> {
  	return this.call('publish_role', role);
  }

  async publishRoleClaim(claim: RoleClaim): Promise<EntryHash> {
  	return this.call('publish_RoleClaim', claim);
  }

  async publishMembraneCrossedClaim(claim: MembraneCrossedClaim): Promise<EntryHash> {
  	return this.call('publish_MembraneCrossedClaim', claim);
  }

  async getRoleWithName(name: string): Promise<[EntryHash, MembraneRole, ] | null> {
  	return this.call('get_role_with_name', name);
  }

  async hasRole(input: HasRoleInput): Promise<SignedActionHashed | null> {
  	return this.call('has_role', input);
  }

  async doIHaveRole(roleEh: EntryHashB64): Promise<EntryHashB64 | null> {
  	return this.call('do_i_have_role', roleEh);
  }

  async publishVouch(vouch: Vouch): Promise<EntryHash> {
  	return this.call('publish_vouch', vouch);
  }

  async getMyEmittedVouches(maybeRole: string): Promise<EntryHash[]> {
  	return this.call('get_my_emitted_vouches', maybeRole);
  }

  async getMyReceivedVouches(maybeRole: string): Promise<[EntryHash, AgentPubKey, ][]> {
  	return this.call('get_my_received_vouches', maybeRole);
  }
}
