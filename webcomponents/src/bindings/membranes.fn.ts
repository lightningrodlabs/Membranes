/* This file is generated by zits. Do not edit manually */

import {ZomeName, FunctionName} from '@holochain/client';


/** Array of all zome function names in "membranes" */
export const membranesFunctionNames: FunctionName[] = [
	"entry_defs",

	"get_all_membranes_details",
	"get_all_roles",
	"get_all_roles_details",
	"get_role_by_name",
	"get_all_thresholds_details",

	"claim_all_membranes",
	"claim_membrane",
	"get_create_count",
	"claim_role_with_membrane",
	"claim_role_by_name",
	"claim_all_roles",
	"get_vouch",
	"get_threshold",
	"get_membrane",
	"get_role",
	"get_membrane_crossed_claim",
	"get_my_role_claims_details",
	"get_my_membrane_claims_details",
	"has_crossed_membrane",
	"dna_info_hack",
	"echo_app_entry_def",
	"get_vouch_author",
	"publish_vouchThreshold",
	"publish_createEntryCountThreshold",
	"publish_membrane",
	"publish_role",
	"publish_RoleClaim",
	"publish_MembraneCrossedClaim",
	"get_role_with_name",
	"has_role",
	"do_i_have_role",
	"publish_vouch",
	"get_my_emitted_vouches",
	"get_my_received_vouches",];


/** Generate tuple array of function names with given zomeName */
export function generateMembranesZomeFunctionsArray(zomeName: ZomeName): [ZomeName, FunctionName][] {
   let fns: [ZomeName, FunctionName][] = [];
   for (const fn of membranesFunctionNames) {
      fns.push([zomeName, fn]);
   }
   return fns;
}


/** Tuple array of all zome function names with default zome name "membranes" */
export const membranesZomeFunctions: [ZomeName, FunctionName][] = generateMembranesZomeFunctionsArray("membranes");
