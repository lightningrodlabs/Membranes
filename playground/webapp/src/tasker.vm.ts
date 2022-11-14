import {createContext} from "@lit-labs/context";
import { EntryHash} from "@holochain/client";
import {EntryHashB64, ActionHashB64, AgentPubKeyB64, Dictionary} from '@holochain-open-dev/core-types';
import {deserializeHash, serializeHash} from "@holochain-open-dev/utils";
import {TaskerBridge} from './tasker.bridge';
import {TaskItemEntry, TaskListEntry} from './tasker.types';
import {DnaClient, ZomeViewModel} from "@ddd-qc/dna-client";


//export const taskerContext = createContext<TaskerViewModel>('tasker/service');


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
export class TaskerViewModel extends ZomeViewModel<TaskerPerspective, TaskerBridge>  {
  /** Ctor */
  constructor(protected dnaClient: DnaClient) {
    super(new TaskerBridge(dnaClient));
  }

  /** -- ZomeViewModel -- */
  static context = createContext<TaskerViewModel>('zome_view_model/tasker');
  getContext(): any {return TaskerViewModel.context}

  /** Private */
  private _perspective: TaskerPerspective = emptyPerspective;

  get perspective(): TaskerPerspective {
    return this._perspective;
  }

  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }


  /** -- Methods -- */

  /** */
  async pullAllLists() {
    const lists = await this._bridge.getAllLists();
    //console.log("pullAllLists() lists:", lists);
    //console.log("pullAllLists() taskListEntryStore:", this.taskListEntryStore);
    for (const pair of lists) {
      const ehB64 = serializeHash(pair[0])
      this._perspective.taskListEntries[ehB64] = pair[1];
    }
    this.notify()
  }


  /** */
  async probeDht() {
    console.log("taskerViewModel.probeDht() called")
    /** Get Lists */
    await this.pullAllLists();
    const listEntries = this._perspective.taskListEntries;
    //console.log({listEntries})
    let pr = Object.entries(listEntries).map(async ([listEhB64, listEntry]) => {
      const listEh: EntryHash = deserializeHash(listEhB64);
      const triples: [EntryHash, TaskItemEntry, boolean][] = await this._bridge.getListItems(listEh);
      //console.log({listEhB64, triples})
      const isLocked = await this._bridge.isListLocked(listEh);
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
      this.notify()
    })


    /** Get My Roles */
    let res = await this._bridge.getMyRoleClaimsDetails();
    let p = Object.values(res).map(async ([_claim_eh, roleClaim]) => {
      let role = await this._bridge.getRole(roleClaim.roleEh);
      return role? role.name : "";
    })
    Promise.all(p).then((v) => {
      this._perspective.myRoles = v;
      this.notify()
    })
    this.notify()
  }


  /** Perform methods */

  /** */
  async createTaskItem(title: string, assignee: AgentPubKeyB64, listEh: EntryHashB64): Promise<ActionHashB64> {
    let res = serializeHash(await this._bridge.createTaskItem(title, deserializeHash(assignee), deserializeHash(listEh)));
    this.probeDht();
    return res;
  }

  /** */
  async createTaskList(title: string): Promise<ActionHashB64> {
    let newList = serializeHash(await this._bridge.createTaskList(title));
    this.pullAllLists();
    return newList;
  }

  async lockTaskList(eh: EntryHashB64): Promise<ActionHashB64> {
    let res = serializeHash(await this._bridge.lockTaskList(deserializeHash(eh)));
    this.probeDht();
    return res;
  }

  async completeTask(eh: EntryHashB64): Promise<ActionHashB64> {
    let res = serializeHash(await this._bridge.completeTask(deserializeHash(eh)));
    //this.pullAllFromDht();
    return res;
  }
}
