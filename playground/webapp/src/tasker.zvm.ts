import {EntryHash, ZomeName} from "@holochain/client";
import {EntryHashB64, ActionHashB64, AgentPubKeyB64, Dictionary} from '@holochain-open-dev/core-types';
import {deserializeHash, serializeHash} from "@holochain-open-dev/utils";
import {TaskerProxy} from './tasker.proxy';
import {TaskItemEntry, TaskListEntry} from './tasker.types';
import {ZomeViewModel, CellProxy} from "@ddd-qc/dna-client";
import {MembranesProxy} from "@membranes/elements";
import {MEMBRANES_ZOME_NAME} from "./defs";


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


/** */
export interface TaskerPerspective {
  /** EntryHash -> TaskList */
  taskLists: Dictionary<TaskList>,
  taskListEntries: Dictionary<TaskListEntry>,
  /** EntryHash -> TaskItem */
  taskItems: Dictionary<TaskItem>,
  myRoles: string[]
}

const emptyPerspective: TaskerPerspective = {
  taskLists: {},
  taskListEntries: {},
  taskItems: {},
  myRoles: [],
}



/**
 *
 */
export class TaskerZvm extends ZomeViewModel {

  static readonly ZOME_PROXY = TaskerProxy;
  get zomeProxy(): TaskerProxy {return this._zomeProxy as TaskerProxy;}


  private _membranesProxy: MembranesProxy;


  constructor(cellProxy: CellProxy, zomeName?: ZomeName) {
    super(cellProxy, zomeName);
    this._membranesProxy = new MembranesProxy(cellProxy, MEMBRANES_ZOME_NAME);

  }


  /** -- ViewModel -- */

  private _perspective: TaskerPerspective = emptyPerspective;

  /* */
  get perspective(): TaskerPerspective {return this._perspective}

  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }


  /** -- Methods -- */

  /** */
  async pullAllLists() {
    const lists = await this.zomeProxy.getAllLists();
    console.log("pullAllLists() lists:", lists);
    //console.log("pullAllLists() taskListEntryStore:", this.taskListEntryStore);
    for (const pair of lists) {
      const ehB64 = serializeHash(pair[0])
      this._perspective.taskListEntries[ehB64] = pair[1];
    }
    this.notifySubscribers();
  }


  /** */
  async probeAll() {
    console.log("taskerViewModel.probeAll() called")
    /** Get Lists */
    await this.pullAllLists();
    const listEntries = this._perspective.taskListEntries;
    //console.log({listEntries})
    let pr = Object.entries(listEntries).map(async ([listEhB64, listEntry]) => {
      const listEh: EntryHash = deserializeHash(listEhB64);
      const triples: [EntryHash, TaskItemEntry, boolean][] = await this.zomeProxy.getListItems(listEh);
      //console.log({listEhB64, triples})
      const isLocked = await this.zomeProxy.isListLocked(listEh);
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
        for (const obj of results) {
          this._perspective.taskLists[obj.eh] = obj.list;
        }
      this.notifySubscribers()
    })


    /** Get My Roles */
    let res = await this._membranesProxy.getMyRoleClaimsDetails();
    let p = Object.values(res).map(async ([_claim_eh, roleClaim]) => {
      let role = await this._membranesProxy.getRole(roleClaim.roleEh);
      return role? role.name : "";
    })
    Promise.all(p).then((v) => {
      this._perspective.myRoles = v;
      this.notifySubscribers()
    })
    this.notifySubscribers()
  }


  /** Perform methods */

  /** */
  async createTaskItem(title: string, assignee: AgentPubKeyB64, listEh: EntryHashB64): Promise<ActionHashB64> {
    let res = serializeHash(await this.zomeProxy.createTaskItem(title, deserializeHash(assignee), deserializeHash(listEh)));
    this.probeAll();
    return res;
  }

  /** */
  async createTaskList(title: string): Promise<ActionHashB64> {
    let newList = serializeHash(await this.zomeProxy.createTaskList(title));
    this.pullAllLists();
    return newList;
  }

  async lockTaskList(eh: EntryHashB64): Promise<ActionHashB64> {
    let res = serializeHash(await this.zomeProxy.lockTaskList(deserializeHash(eh)));
    this.probeAll();
    return res;
  }

  async completeTask(eh: EntryHashB64): Promise<ActionHashB64> {
    let res = serializeHash(await this.zomeProxy.completeTask(deserializeHash(eh)));
    //this.pullAllFromDht();
    return res;
  }
}
