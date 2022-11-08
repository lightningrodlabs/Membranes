import {AgnosticClient} from '@holochain-open-dev/cell-client';

import {
  TaskListEntry,
  TaskItemEntry,
  //Signal,
} from './tasker.types';
import {AgentPubKey, CellId, EntryHash, ActionHash} from "@holochain/client";
import {MembraneRoleEntry, RoleClaimEntry} from "@membranes/elements";


export class TaskerBridge {

  /** Ctor */
  constructor(public agnosticClient: AgnosticClient, public cellId: CellId ) {}


  /** Tasker zome functions */

  async createTaskList(title: string): Promise<ActionHash> {
    return this.callZome("tasker",'create_task_list', title);
  }

  async createTaskItem(title: string, assignee: AgentPubKey, listEh: EntryHash): Promise<ActionHash> {
    return this.callZome("tasker",'create_task_item', {title, assignee, listEh});
  }

  // async reassignTask(taskAh: ActionHash, assignee: ActionHash): Promise<ActionHash> {
  //   return this.callZome("tasker",'reassign_task', {taskAh, assignee});
  // }

  async completeTask(eh: EntryHash): Promise<ActionHash> {
    return this.callZome("tasker",'complete_task', eh);
  }

  async lockTaskList(eh: EntryHash): Promise<ActionHash> {
    return this.callZome("tasker",'membraned_lock_task_list', eh);
  }

  async getListItems(eh: EntryHash): Promise<[EntryHash, TaskItemEntry, boolean][]> {
    return this.callZome("tasker",'get_list_items', eh);
  }


  // async getTaskItem(eh: EntryHash): Promise<[TaskItemEntry, boolean] | null> {
  //   return this.callZome("tasker",'get_task_item', eh);
  // }


  async getAllLists(): Promise<[EntryHash, TaskListEntry][]> {
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
