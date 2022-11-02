import {AgnosticClient} from '@holochain-open-dev/cell-client';
import { EntryHashB64, ActionHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';

import {
  TaskListEntry,
  TaskItemEntry,
  //Signal,
  TaskItem, TaskList,
} from './tasker.types';
import {CellId, EntryHash} from "@holochain/client";
import {MembraneRoleEntry, RoleClaimEntry} from "@membranes/elements";


export class TaskerBridge {

  /** Ctor */
  constructor(public agnosticClient: AgnosticClient, public cellId: CellId /*, protected roleId: string*/) {}


  /** Zome API */

  // async getProperties(): Promise<DnaProperties> {
  //   return this.callPlaceZome('get_properties', null);
  // }


  /** Basic */

  async createTaskList(title: string): Promise<ActionHashB64> {
    return this.callZome("tasker",'create_task_list', title);
  }

  async createTaskItem(title: string, assignee: AgentPubKeyB64, listAh: ActionHashB64): Promise<ActionHashB64> {
    return this.callZome("tasker",'create_task_item', {title, assignee, listAh});
  }

  async reassignTask(taskAh: ActionHashB64, assignee: ActionHashB64): Promise<ActionHashB64> {
    return this.callZome("tasker",'reassign_task', {taskAh, assignee});
  }

  async completeTask(taskAh: ActionHashB64): Promise<ActionHashB64> {
    return this.callZome("tasker",'complete_task', taskAh);
  }

  async lockTaskList(listAh: ActionHashB64): Promise<ActionHashB64> {
    return this.callZome("tasker",'membraned_lock_task_list', listAh);
  }


  async getTaskList(listAh: ActionHashB64): Promise<TaskList | null> {
    return this.callZome("tasker",'get_task_list', listAh);
  }

  async getTaskItem(ah: ActionHashB64): Promise<TaskItem | null> {
    return this.callZome("tasker",'get_task_item', ah);
  }


  async getAllLists(): Promise<ActionHashB64[]> {
    return this.callZome("tasker",'get_all_lists', null);
  }

  /** Membranes */

  async getMyRoleClaimsDetails(): Promise<[EntryHash, RoleClaimEntry][]> {
    return this.callZome("membranes",'get_my_role_claims_details', null);
  }

  async getRole(eh: EntryHash): Promise<MembraneRoleEntry | null> {
    return this.callZome("membranes", "get_role", eh)
  }

  /** Private */

  /** */
  private callZome(zome_name: string, fn_name: string, payload: any): Promise<any> {
    //console.log("callZome: " + fn_name + "() ", payload)
    //console.info({payload})
    try {
      const result = this.agnosticClient.callZome(this.cellId, zome_name, fn_name, payload, 10 * 1000);
      //console.log("callZome: " + fn_name + "() result")
      //console.info({result})
      return result;
    } catch (e) {
      console.error("Calling zome " + fn_name + "() failed: ")
      console.error({e})
    }
    return Promise.reject("callZome failed")
  }



}
