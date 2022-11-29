import {
  TaskListEntry,
  TaskItemEntry,
  //Signal,
} from './tasker.types';
import {AgentPubKey, EntryHash, ActionHash} from "@holochain/client";
import {MembraneRoleEntry, RoleClaimEntry} from "@membranes/elements";
import {ZomeProxy} from "@ddd-qc/dna-client";

/**
 * 
 */
export class TaskerProxy extends ZomeProxy {
  static readonly DEFAULT_ZOME_NAME = 'zTasker';

  /** Tasker zome functions */

  async createTaskList(title: string): Promise<ActionHash> {
    return this.call('create_task_list', title);
  }

  async createTaskItem(title: string, assignee: AgentPubKey, listEh: EntryHash): Promise<ActionHash> {
    return this.call('create_task_item', {title, assignee, listEh});
  }

  // async reassignTask(taskAh: ActionHash, assignee: ActionHash): Promise<ActionHash> {
  //   return this.callZome("tasker",'reassign_task', {taskAh, assignee});
  // }

  async completeTask(eh: EntryHash): Promise<ActionHash> {
    return this.call('complete_task', eh);
  }

  async lockTaskList(eh: EntryHash): Promise<ActionHash> {
    return this.call('membraned_lock_task_list', eh);
  }

  async getListItems(eh: EntryHash): Promise<[EntryHash, TaskItemEntry, boolean][]> {
    return this.call('get_list_items', eh);
  }


  // async getTaskItem(eh: EntryHash): Promise<[TaskItemEntry, boolean] | null> {
  //   return this.callZome("tasker",'get_task_item', eh);
  // }


  async getAllLists(): Promise<[EntryHash, TaskListEntry][]> {
    return this.call('get_all_lists', null);
  }


  async isListLocked(listEh: EntryHash): Promise<boolean> {
    return this.call('is_list_locked', listEh);
  }

  // /** Membranes */
  //
  // async getMyRoleClaimsDetails(): Promise<[EntryHash, RoleClaimEntry][]> {
  //   return this._cellProxy.callZome("membranes", 'get_my_role_claims_details', null, null);
  // }
  //
  // async getRole(eh: EntryHash): Promise<MembraneRoleEntry | null> {
  //   return this._cellProxy.callZome("membranes", "get_role", eh, null)
  // }

}
