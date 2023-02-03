/* This file is generated by zits. Do not edit manually */

import {ZomeName, FunctionName} from '@holochain/client';


/** Array of all zome function names in "createEntryCount" */
export const createEntryCountFunctionNames: FunctionName[] = [
	"entry_defs",


	"get_create_count",
	"publish_CreateEntryCount_threshold",
	"get_threshold_CreateEntryCount",
	"get_all_thresholds_CreateEntryCount",
	"claim_threshold_CreateEntryCount",];


/** Generate tuple array of function names with given zomeName */
export function generateCreateEntryCountZomeFunctionsArray(zomeName: ZomeName): [ZomeName, FunctionName][] {
   let fns: [ZomeName, FunctionName][] = [];
   for (const fn of createEntryCountFunctionNames) {
      fns.push([zomeName, fn]);
   }
   return fns;
}


/** Tuple array of all zome function names with default zome name "zThreshold_CreateEntryCount" */
export const createEntryCountZomeFunctions: [ZomeName, FunctionName][] = generateCreateEntryCountZomeFunctionsArray("zThreshold_CreateEntryCount");
