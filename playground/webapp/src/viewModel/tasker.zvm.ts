import {
    EntryHash, EntryHashB64,
    ZomeName
} from "@holochain/client";
import {TaskerProxy} from '../bindings/tasker.proxy';
import {TaskItem} from '../bindings/tasker.types';
import {ZomeViewModel, CellProxy, DnaViewModel, EntryId, AgentId, ActionId} from "@ddd-qc/lit-happ";
import {MembranesProxy} from "@membranes/elements";
import {MEMBRANES_ZOME_NAME} from "./tasker.dvm";
import {TaskerPerspective, TaskItemMaterialized, TaskListMaterialized} from "./tasker.perspective";



/**
 *
 */
export class TaskerZvm extends ZomeViewModel {

  static override readonly ZOME_PROXY = TaskerProxy;
  get zomeProxy(): TaskerProxy {return this._zomeProxy as TaskerProxy;}


  /** Hack to call Membranes zome from tasker zvm */
  private _membranesProxy: MembranesProxy;

  constructor(cellProxy: CellProxy, dvmParent: DnaViewModel, isMainView: boolean, zomeName?: ZomeName) {
    super(cellProxy, dvmParent, isMainView, zomeName);
    this._membranesProxy = new MembranesProxy(cellProxy, MEMBRANES_ZOME_NAME);
  }


  /** -- ViewModel -- */

  private _perspective: TaskerPerspective = {taskLists: {}, taskListEntries:{}, taskItems:{}, myRoles: []};

  /* */
  get perspective(): TaskerPerspective {return this._perspective}



  /** -- Methods -- */

  /** */
  async pullAllLists() {
    const lists = await this.zomeProxy.getAllLists();
    console.log("pullAllLists() lists:", lists);
    //console.log("pullAllLists() taskListEntryStore:", this.taskListEntryStore);
    for (const pair of lists) {
      const eh = new EntryId(pair[0]);
      this._perspective.taskListEntries[eh.b64] = pair[1];
    }

    const listEntries = this._perspective.taskListEntries;
    //console.log({listEntries})
    let pr = Object.entries(listEntries).map(async ([listEhB64, listEntry]) => {
      const listEh: EntryHash = new EntryId(listEhB64).hash;
      const triples: [EntryHash, TaskItem, boolean][] = await this.zomeProxy.getListItems(listEh);
      //console.log({listEhB64, triples})
      const isLocked = await this.zomeProxy.isListLocked(listEh);
      const items: [EntryHashB64, TaskItemMaterialized][]= triples.map(([eh, entry, isCompleted]) => {
        return [new EntryId(eh).b64, {entry, isCompleted}];
      });
      const list: TaskListMaterialized = {
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


    this.notifySubscribers();
  }


  /** */
  override async probeAllInner() {
    console.log("taskerViewModel.probeAll() called");
    /** Reset perspective */
    this._perspective.taskListEntries = {};
    this._perspective.taskLists = {};
    this._perspective.taskItems = {};
    this._perspective.myRoles = [];
    /** Get Lists */
    await this.pullAllLists();


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
  async createTaskItem(title: string, assignee: AgentId, listEh: EntryId): Promise<ActionId> {
    let res = await this.zomeProxy.createTaskItem({
      title,
      assignee: assignee.hash,
      listEh: listEh.hash,
    });
    this.probeAll();
    return new ActionId(res);
  }

  /** */
  async createTaskList(title: string): Promise<ActionId> {
    let newList = await this.zomeProxy.createTaskList(title);
    this.pullAllLists();
    return new ActionId(newList);
  }

  async lockTaskList(eh: EntryId): Promise<ActionId> {
    let res = await this.zomeProxy.membranedLockTaskList(eh.hash);
    this.probeAll();
    return new ActionId(res);
  }

  async completeTask(eh: EntryId): Promise<ActionId> {
    let res = await this.zomeProxy.completeTask(eh.hash);
    //this.pullAllFromDht();
    return new ActionId(res);
  }
}
