/* This file is generated by zits. Do not edit manually */

import {Roles, Membranes, Thresholds, REMOTE_ENDPOINT, CrudType, MembranesEntry, ThresholdType, MembraneCrossedClaim, RoleClaim, MembraneRole, Membrane, MembraneThreshold, ThresholdReachedProof, Privilege, HasRoleInput, ClaimRoleInput, MembraneInput, ClaimThresholdInput, MembraneZomeProperties, } from './membranes.types';
import {
/** types.ts */
HoloHash,
AgentPubKey,
DnaHash,
WasmHash,
EntryHash,
ActionHash,
AnyDhtHash,
KitsuneAgent,
KitsuneSpace,
HoloHashB64,
AgentPubKeyB64,
DnaHashB64,
WasmHashB64,
EntryHashB64,
ActionHashB64,
AnyDhtHashB64,
InstalledAppId,
Signature,
CellId,
DnaProperties,
RoleName,
Timestamp,
Duration,
HoloHashed,
NetworkInfo,
FetchQueueInfo,
/** hdk/action.ts */
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
/** hdk/capabilities.ts */
CapSecret,
CapClaim,
ZomeCallCapGrant,
CapAccess,
CapGrant,
GrantedFunctionsType,
///** hdk/countersigning.ts */
//CounterSigningSessionData,
//PreflightRequest,
//CounterSigningSessionTimes,
//ActionBase,
//CounterSigningAgents,
//PreflightBytes,
//Role,
//CountersigningAgentState,
/** hdk/dht-ops.ts */
DhtOpType,
DhtOp,
getDhtOpType,
getDhtOpAction,
getDhtOpEntry,
getDhtOpSignature,
/** hdk/entry.ts */
EntryVisibility,
AppEntryDef,
EntryType,
EntryContent,
Entry,
/** hdk/record.ts */
Record as HcRecord,
RecordEntry as HcRecordEntry,
/** api/admin/types.ts */
InstalledAppInfoStatus,
StemCell,
ProvisionedCell,
ClonedCell,
CellType,
CellInfo,
AppInfo,
MembraneProof,
FunctionName,
ZomeName,
ZomeDefinition,
IntegrityZome,
CoordinatorZome,
DnaDefinition,
ResourceBytes,
ResourceMap,
CellProvisioningStrategy,
CellProvisioning,
DnaVersionSpec,
DnaVersionFlexible,
AppRoleDnaManifest,
AppRoleManifest,
AppManifest,
AppBundle,
AppBundleSource,
NetworkSeed,
ZomeLocation,
   } from '@holochain/client';

import {
/** Common */
DhtOpHashB64,
DhtOpHash,
/** DnaFile */
DnaFile,
DnaDef,
Zomes,
WasmCode,
/** entry-details */
EntryDetails,
RecordDetails,
Details,
DetailsType,
EntryDhtStatus,
/** Validation */
ValidationStatus,
ValidationReceipt,
   } from '@holochain-open-dev/core-types';

import {ZomeProxy} from '@ddd-qc/lit-happ';
import {membranesFunctionNames} from './membranes.fn';

/**
 *
 */
export class MembranesProxy extends ZomeProxy {
  static readonly DEFAULT_ZOME_NAME = "membranes"
  static readonly FN_NAMES = membranesFunctionNames
 

  async getAllMembranesDetails(): Promise<[EntryHash, Membrane][]> {
    return this.call('get_all_membranes_details', null);
  }

  async getAllRoles(): Promise<[EntryHashB64, string][]> {
    return this.call('get_all_roles', null);
  }

  async getAllRolesDetails(): Promise<[EntryHash, MembraneRole][]> {
    return this.call('get_all_roles_details', null);
  }

  async getRoleByName(requestedName: string): Promise<MembraneRole | null> {
    return this.call('get_role_by_name', requestedName);
  }

  async getAllThresholdsDetails(): Promise<[EntryHash, MembraneThreshold][]> {
    return this.call('get_all_thresholds_details', null);
  }


  async claimAllMembranes(): Promise<number> {
    return this.call('claim_all_membranes', null);
  }

  async claimMembrane(input: MembraneInput): Promise<EntryHashB64 | null> {
    return this.call('claim_membrane', input);
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

  async getProof(ah: ActionHash): Promise<ThresholdReachedProof | null> {
    return this.call('get_proof', ah);
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

  async getMyRoleClaimsDetails(): Promise<[EntryHash, RoleClaim][]> {
    return this.call('get_my_role_claims_details', null);
  }

  async getMyMembraneClaimsDetails(): Promise<[EntryHash, MembraneCrossedClaim][]> {
    return this.call('get_my_membrane_claims_details', null);
  }

  async hasCrossedMembrane(input: MembraneInput): Promise<EntryHashB64 | null> {
    return this.call('has_crossed_membrane', input);
  }

  async dnaInfoHack(): Promise<ZomeName[]> {
    return this.call('dna_info_hack', null);
  }

  async echoAppEntryDef(entryType: AppEntryDef): Promise<void> {
    return this.call('echo_app_entry_def', entryType);
  }

  async publishThreshold(threshold: MembraneThreshold): Promise<EntryHash> {
    return this.call('publish_threshold', threshold);
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

  async registerThresholdType(tt: ThresholdType): Promise<ActionHash> {
    return this.call('register_threshold_type', tt);
  }

  async getAllRegisteredThresholdTypes(): Promise<ThresholdType[]> {
    return this.call('get_all_registered_threshold_types', null);
  }

  async getZomeForThreshold(typeName: string): Promise<string> {
    return this.call('get_zome_for_threshold', typeName);
  }

  async getRoleWithName(name: string): Promise<[EntryHash, MembraneRole] | null> {
    return this.call('get_role_with_name', name);
  }

  async hasRole(input: HasRoleInput): Promise<SignedActionHashed | null> {
    return this.call('has_role', input);
  }

  async doIHaveRole(roleEh: EntryHashB64): Promise<EntryHashB64 | null> {
    return this.call('do_i_have_role', roleEh);
  }
}
