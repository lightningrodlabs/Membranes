import {TaskerZvm} from "./tasker.zvm";
import {MembranesZvm} from "@membranes/elements";
import {AgentDirectoryZvm} from "@ddd-qc/agent-directory";
import {ZvmDef} from "@ddd-qc/dna-client";


export const MEMBRANES_ZOME_NAME = "zMembranes";

// export const TASKER_DVM_DEF: ZvmDef[] = [
//     TaskerZvm,
//     [MembranesZvm, MEMBRANES_ZOME_NAME],
//     [AgentDirectoryZvm, "zAgentDirectory"],
// ];