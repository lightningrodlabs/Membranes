import { DnaViewModel, ZvmDef } from "@ddd-qc/lit-happ";
import { MembranesZvm, VouchZvm, CreateEntryCountZvm } from "@membranes/elements";
import {TaskerZvm} from "./tasker.zvm"
import {AgentDirectoryZvm} from "@ddd-qc/agent-directory"
import {AppSignalCb} from "@holochain/client";


export const MEMBRANES_ZOME_NAME = "zMembranes";

/**
 * TODO: Make a "passthrough" DVM generator in dna-client based on ZVM_DEFS
 */
 export class TaskerDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static readonly DEFAULT_BASE_ROLE_NAME = "rTasker";
  static readonly ZVM_DEFS: ZvmDef[] = [
   TaskerZvm,
   [MembranesZvm, MEMBRANES_ZOME_NAME],
   [AgentDirectoryZvm, "zAgentDirectory"],
   CreateEntryCountZvm,
   VouchZvm,
  ];

  readonly signalHandler?: AppSignalCb;


  /** QoL Helpers */
  get taskerZvm(): TaskerZvm {return this.getZomeViewModel(TaskerZvm.DEFAULT_ZOME_NAME) as TaskerZvm}
  get membranesZvm(): MembranesZvm {return this.getZomeViewModel(MEMBRANES_ZOME_NAME) as MembranesZvm}
  get AgentDirectoryZvm(): AgentDirectoryZvm {return this.getZomeViewModel("zAgentDirectory") as AgentDirectoryZvm}

  get createEntryCountZvm(): CreateEntryCountZvm {return this.getZomeViewModel(CreateEntryCountZvm.DEFAULT_ZOME_NAME) as CreateEntryCountZvm}
  get vouchZvm(): VouchZvm {return this.getZomeViewModel(VouchZvm.DEFAULT_ZOME_NAME) as VouchZvm}

  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean {return true}

  get perspective(): void {return}

}