import { DnaViewModel } from "@ddd-qc/dna-client";
import { MembranesZvm } from "@membranes/elements";
import {TaskerZvm} from "./tasker.zvm"

/**
 *
 */
 export class TaskerDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static readonly DEFAULT_ROLE_ID = "rTasker";
  static readonly ZVM_DEFS = [
    TaskerZvm,
    [MembranesZvm, "zMembranes"],
    [AgentDirectoryZvm, "zAgentDirectory"],
  ]

  /** QoL Helpers */
  get taskerZvm(): TaskerZvm {return this.getZomeViewModel(TaskerZvm.DEFAULT_ZOME_NAME) as TaskerZvm}
  get membranesZvm(): MembranesZvm {return this.getZomeViewModel("zMembranes") as MembranesZvm}
  get AgentDirectoryZvm(): AgentDirectoryZvm {return this.getZomeViewModel("zAgentDirectory") as AgentDirectoryZvm}


  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean {return true}

  get perspective(): void {return}

}