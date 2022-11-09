import { writable, Writable, derived, Readable, get, readable } from 'svelte/store';
import {createContext} from "@lit-labs/context";
import {CellId, EntryHash} from "@holochain/client";
import {EntryHashB64, ActionHashB64, AgentPubKeyB64, Dictionary} from '@holochain-open-dev/core-types';
import {AgnosticClient} from '@holochain-open-dev/cell-client';
import {deserializeHash, serializeHash} from "@holochain-open-dev/utils";
import {TaskerBridge} from './tasker.bridge';
import {TaskItemEntry, TaskListEntry} from './tasker.types';
import {LitElement} from "lit";


export const taskerContext = createContext<TaskerViewModel>('tasker/service');


/** */
export interface TaskItem {
  entry: TaskItemEntry,
  isCompleted: boolean,
}
/** */
export interface TaskList {
  title: string,
  isLocked: boolean,
  items: [EntryHashB64, TaskItem][],
}



// /** Convert hash (Uint8Array) to/from base64 string */
// export function htos(u8array: Uint8Array): string {
//   if (!u8array) {
//     console.error("htos() argument is undefined")
//   }
//   return base64.bytesToBase64(u8array)
// }
// export function stoh(str: string): Uint8Array {
//   if (!str) {
//     console.error("stoh() argument is undefined")
//   }
//   return base64.base64ToBytes(str)
// }



/**
 *
 */
export class TaskerViewModel {
  /** Ctor */
  constructor(protected client: AgnosticClient, cellId: CellId) {
    this.bridge = new TaskerBridge(client, cellId);
    this.myAgentPubKey = serializeHash(cellId[1]);
  }

  /** Static info */
  myAgentPubKey: AgentPubKeyB64;
  /** Private */
  private bridge : TaskerBridge

  /** Stores */
  /** EntryHash -> TaskList */
  private _taskListStore: Writable<Dictionary<TaskList>> = writable({});
  private _taskListEntryStore: Writable<Dictionary<TaskListEntry>> = writable({});
  /** EntryHash -> TaskItem */
  private _taskItemStore: Writable<Dictionary<TaskItem>> = writable({});
  private _myRoles: Writable<string[]> = writable([]);


  /** Get stores */
  taskListEntries(): Dictionary<TaskListEntry> { return get(this._taskListEntryStore) }
  taskLists(): Dictionary<TaskList> { return get(this._taskListStore) }
  taskItems(): Dictionary<TaskItem> { return get(this._taskItemStore) }
  myRoles(): string[] { return get(this._myRoles) }


  /** */
  subscribe(parent: LitElement) {
    this._taskListEntryStore.subscribe((_value) => {
      //console.log("localTaskListStore update called");
      parent.requestUpdate();
    });
    this._taskListStore.subscribe((_value) => {parent.requestUpdate();});
    this._myRoles.subscribe((_value) => {parent.requestUpdate();});
  }



  async pullAllLists() {
    const lists = await this.bridge.getAllLists();
    //console.log("pullAllLists() lists:", lists);
    //console.log("pullAllLists() taskListEntryStore:", this.taskListEntryStore);
    this._taskListEntryStore.update(store => {
      for (const pair of lists) {
        const ehB64 = serializeHash(pair[0])
        store[ehB64] = pair[1];
      }
      //console.log("pullAllLists() update:", store)
      return store;
    });
  }


  /** */
  async pullAllFromDht() {
    /** Get Lists */
    await this.pullAllLists();
    const listEntries = this.taskListEntries()
    //console.log({listEntries})
    let pr = Object.entries(listEntries).map(async ([listEhB64, listEntry]) => {
      const listEh: EntryHash = deserializeHash(listEhB64);
      const triples: [EntryHash, TaskItemEntry, boolean][] = await this.bridge.getListItems(listEh);
      //console.log({listEhB64, triples})
      const isLocked = await this.bridge.isListLocked(listEh);
      const items: [EntryHashB64, TaskItem][]= triples.map(([eh, entry, isCompleted]) => {
        return [serializeHash(eh), {entry, isCompleted}];
      });
      const list: TaskList = {
        title: listEntry.title,
        isLocked,
        items,
      };
      return {eh: listEhB64, list};
    })
    Promise.all(pr).then((results) => {
      this._taskListStore.update(store => {
        for (const obj of results) {
          //const str: string = ehb64;
          store[obj.eh] = obj.list;
        }
        return store;
      })
    })


    /** Get My Roles */
    let res = await this.bridge.getMyRoleClaimsDetails();
    let p = Object.values(res).map(async ([_claim_eh, roleClaim]) => {
      let role = await this.bridge.getRole(roleClaim.roleEh);
      return role? role.name : "";
    })
    Promise.all(p).then((v) => {
      this._myRoles.update(store => {
        store = v;
        return store;
      })
    })
  }


  /** Perform methods */


  /** */
  async createTaskItem(title: string, assignee: AgentPubKeyB64, listEh: EntryHashB64): Promise<ActionHashB64> {
    let res = serializeHash(await this.bridge.createTaskItem(title, deserializeHash(assignee), deserializeHash(listEh)));
    this.pullAllFromDht();
    return res;
  }

  /** */
  async createTaskList(title: string): Promise<ActionHashB64> {
    let newList = serializeHash(await this.bridge.createTaskList(title));
    this.pullAllLists();
    return newList;
  }

  async lockTaskList(eh: EntryHashB64): Promise<ActionHashB64> {
    let res = serializeHash(await this.bridge.lockTaskList(deserializeHash(eh)));
    this.pullAllFromDht();
    return res;
  }

  async completeTask(eh: EntryHashB64): Promise<ActionHashB64> {
    let res = serializeHash(await this.bridge.completeTask(deserializeHash(eh)));
    //this.pullAllFromDht();
    return res;
  }
}
