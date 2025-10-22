import { DnaViewModel, ZvmDef } from "@ddd-qc/lit-happ";
import {MembranesZvm, VouchZvm, CreateEntryCountZvm, ProgenitorZvm} from "@membranes/elements";
import {TaskerZvm} from "./tasker.zvm"
import {AgentDirectoryZvm} from "@ddd-qc/agent-directory"
import {SignalCb} from "@holochain/client";


export const MEMBRANES_ZOME_NAME = "zMembranes";

/**
 * TODO: Make a "passthrough" DVM generator in dna-client based on ZVM_DEFS
 */
 export class TaskerDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static override readonly DEFAULT_BASE_ROLE_NAME = "rTasker";
  /// WARN MUST BE IN SAME ORDER AS DNA.YAML (Missing api from Holochain to correlate integrity & coordinator)
  static override readonly ZVM_DEFS: ZvmDef[] = [
   [MembranesZvm, MEMBRANES_ZOME_NAME],
   CreateEntryCountZvm,
   VouchZvm,
   ProgenitorZvm,
   TaskerZvm,
   [AgentDirectoryZvm, "zAgentDirectory"],
  ];

  readonly signalHandler?: SignalCb;


  /** QoL Helpers */
  get taskerZvm(): TaskerZvm {return this.getZomeViewModel(TaskerZvm.DEFAULT_ZOME_NAME) as TaskerZvm}
  get membranesZvm(): MembranesZvm {return this.getZomeViewModel(MEMBRANES_ZOME_NAME) as MembranesZvm}
  get AgentDirectoryZvm(): AgentDirectoryZvm {return this.getZomeViewModel("zAgentDirectory") as AgentDirectoryZvm}

  get createEntryCountZvm(): CreateEntryCountZvm {return this.getZomeViewModel(CreateEntryCountZvm.DEFAULT_ZOME_NAME) as CreateEntryCountZvm}
  get vouchZvm(): VouchZvm {return this.getZomeViewModel(VouchZvm.DEFAULT_ZOME_NAME) as VouchZvm}

  /** -- ViewModel Interface -- */

  protected override hasChanged(): boolean {return true}

  get perspective(): {} {return {}}

}