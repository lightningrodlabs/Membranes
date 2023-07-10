/* This file is generated by zits. Do not edit manually */

import {ZomeName, FunctionName} from '@holochain/client';


/** Array of all zome function names in "tasker" */
export const taskerFunctionNames: FunctionName[] = [
	"entry_defs", 
	"get_zome_info", 
	"get_dna_info",



	"create_task_list",
	"create_task_item",
	"complete_task",
	"is_list_locked",
	"get_task_item",
	"get_list_items",
	"get_all_lists",
	"membraned_lock_task_list",
];


/** Generate tuple array of function names with given zomeName */
export function generateTaskerZomeFunctionsArray(zomeName: ZomeName): [ZomeName, FunctionName][] {
   const fns: [ZomeName, FunctionName][] = [];
   for (const fn of taskerFunctionNames) {
      fns.push([zomeName, fn]);
   }
   return fns;
}


/** Tuple array of all zome function names with default zome name "zTasker" */
export const taskerZomeFunctions: [ZomeName, FunctionName][] = generateTaskerZomeFunctionsArray("zTasker");
