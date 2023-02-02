/* This file is generated by zits. Do not edit manually */

import {ZomeName, FunctionName} from '@holochain/client';


/** Array of all zome function names in "vouch" */
export const vouchFunctionNames: FunctionName[] = [
	"entry_defs",


	"get_all_role_names",
	"claim_threshold_Vouch",
	"get_vouch_author",
	"get_vouch",
	"publish_vouch",
	"get_my_emitted_vouches",
	"get_my_received_vouches",];


/** Generate tuple array of function names with given zomeName */
export function generateVouchZomeFunctionsArray(zomeName: ZomeName): [ZomeName, FunctionName][] {
   let fns: [ZomeName, FunctionName][] = [];
   for (const fn of vouchFunctionNames) {
      fns.push([zomeName, fn]);
   }
   return fns;
}


/** Tuple array of all zome function names with default zome name "zThreshold_Vouch" */
export const vouchZomeFunctions: [ZomeName, FunctionName][] = generateVouchZomeFunctionsArray("zThreshold_Vouch");
