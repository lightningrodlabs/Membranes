import {AgnosticClient} from '@holochain-open-dev/cell-client';
import { EntryHashB64, ActionHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { serializeHash } from '@holochain-open-dev/utils';

import {
  TaskListEntry,
  TaskItemEntry,
  HoloHashed,
  //Signal,
  Dictionary, TaskItem, TaskList,
} from './types';
import {CellId, InstalledAppInfo} from "@holochain/client";

export class HolochainService {

  /** Ctor */
  constructor(public agnosticClient: AgnosticClient, public cellId: CellId /*, protected roleId: string*/) {
    // let maybe_cell = hcClient.cellDataByRoleId(roleId);
    // if (!maybe_cell) {
    //   throw new Error("Cell not found for role: " + roleId);
    // }
    //this.agnosticClient = client
  }


  /** Fields */

  //agnosticClient: AgnosticClient


  /** Methods */

  get myAgentPubKey() : AgentPubKeyB64 {
    return serializeHash(this.cellId[1]);
    //return this.agentId
  }


  /** Zome API */

  // async getProperties(): Promise<DnaProperties> {
  //   return this.callPlaceZome('get_properties', null);
  // }


  async createTaskList(title: string): Promise<ActionHashB64> {
    return this.callZome('create_task_list', title);
  }

  async createTaskItem(title: string, assignee: AgentPubKeyB64, listAh: ActionHashB64): Promise<ActionHashB64> {
    return this.callZome('create_task_item', {title, assignee, listAh});
  }

  async reassignTask(taskAh: ActionHashB64, assignee: ActionHashB64): Promise<ActionHashB64> {
    return this.callZome('reassign_task', {taskAh, assignee});
  }

  async completeTask(taskAh: ActionHashB64): Promise<ActionHashB64> {
    return this.callZome('complete_task', taskAh);
  }

  async lockTaskList(listAh: ActionHashB64): Promise<ActionHashB64> {
    return this.callZome('lock_task_list', listAh);
  }


  async getTaskList(listAh: ActionHashB64): Promise<TaskList | null> {
    return this.callZome('get_task_list', listAh);
  }

  async getTaskItem(ah: ActionHashB64): Promise<TaskItem | null> {
    return this.callZome('get_task_item', ah);
  }


  async getAllLists(): Promise<[ActionHashB64]> {
    return this.callZome('get_all_lists', null);
  }


  /** Private */

  /** */
  private callZome(fn_name: string, payload: any): Promise<any> {
    console.log("callZome: " + fn_name + "() ", payload)
    console.info({payload})
    try {
      const result = this.agnosticClient.callZome(this.cellId, "tasker", fn_name, payload, 10 * 1000);
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
