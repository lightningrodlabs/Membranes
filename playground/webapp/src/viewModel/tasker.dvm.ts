import { DnaViewModel, ZvmDef } from "@ddd-qc/lit-happ";
import { MembranesZvm } from "@membranes/elements";
import {TaskerZvm} from "./tasker.zvm"
import {AgentDirectoryZvm} from "@ddd-qc/agent-directory"
import {AppSignalCb} from "@holochain/client";
import {MEMBRANES_ZOME_NAME} from "./defs";

/**
 * TODO: Make a Default DVM generator in dna-client based on ZVM_DEFS
 */
 export class TaskerDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static readonly DEFAULT_BASE_ROLE_NAME = "rTasker";
  static readonly ZVM_DEFS: ZvmDef[] = [
   TaskerZvm,
   [MembranesZvm, MEMBRANES_ZOME_NAME],
   [AgentDirectoryZvm, "zAgentDirectory"],
  ];

  readonly signalHandler?: AppSignalCb;


  /** QoL Helpers */
  get taskerZvm(): TaskerZvm {return this.getZomeViewModel(TaskerZvm.DEFAULT_ZOME_NAME) as TaskerZvm}
  get membranesZvm(): MembranesZvm {return this.getZomeViewModel(MEMBRANES_ZOME_NAME) as MembranesZvm}
  get AgentDirectoryZvm(): AgentDirectoryZvm {return this.getZomeViewModel("zAgentDirectory") as AgentDirectoryZvm}


  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean {return true}

  get perspective(): void {return}

}