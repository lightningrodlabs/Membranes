import {EntryHashB64, ActionHashB64, AgentPubKeyB64, Dictionary} from '@holochain-open-dev/core-types';
import {AgnosticClient, CellClient} from '@holochain-open-dev/cell-client';
import {TaskerBridge} from './tasker.bridge';
import {TaskItem, TaskItemEntry, TaskList } from './tasker.types';
import {CellId} from "@holochain/client";
import {serializeHash} from "@holochain-open-dev/utils";
import {AgentDirectoryBridge} from "./agent_directory.bridge";
import {createContext} from "@lit-labs/context";


const areEqual = (first: Uint8Array, second: Uint8Array) =>
      first.length === second.length && first.every((value, index) => value === second[index]);



export const taskerContext = createContext<TaskerViewModel>('tasker/service');


/**
 *
 */
export class TaskerViewModel {

  /** Private */
  private taskerZome : TaskerBridge
  private agentDirectoryZome : AgentDirectoryBridge
  //private _dnaProperties?: DnaProperties;


  /** Public */

  /** ActionHash -> TaskList */
  taskListStore: Dictionary<TaskList> = {};
  /** ActionHash -> TaskItem */
  taskItemStore: Dictionary<TaskItem> = {};


  agentStore: AgentPubKeyB64[] = []


  /** Static info */

  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  //public snapshots: Readable<Dictionary<SnapshotEntry>> = derived(this.snapshotStore, i => i)
  //public placements: Readable<Dictionary<PlacementEntry[]>> = derived(this.placementStore, i => i)


  /** Ctor */
  constructor(protected client: AgnosticClient, cellId: CellId) {
    this.taskerZome = new TaskerBridge(client, cellId);
    this.agentDirectoryZome = new AgentDirectoryBridge(client, cellId);
    //let cellClient = this.service.cellClient
    this.myAgentPubKey = serializeHash(cellId[1]);

    // this.service.getProperties().then((properties) => {
    //   this.latestBucketIndex = Math.floor(properties.startTime / properties.bucketSizeSec) - 1;
    // });
  }


  /** */
  // async storeTaskList(snapshot: SnapshotEntry, authors: AgentPubKeyB64[]) {
  //   console.log(`storeSnapshot() called for ${snapshot.timeBucketIndex}`)
  //   this.snapshotStore[snapshot.timeBucketIndex] = snapshot
  //   this.publisherStore[snapshot.timeBucketIndex] = authors
  //   // this.snapshotStore.update(store => {
  //   //   store[snapshot.timeBucketIndex] = snapshot
  //   //   return store
  //   // })
  //   if (this.latestStoredBucketIndex < snapshot.timeBucketIndex) {
  //     this.latestStoredBucketIndex = snapshot.timeBucketIndex
  //   }
  //   //console.log(`Snapshot stored at bucket ${snapshot.timeBucketIndex}`)
  // }


  ///** */
  // async getProperties(): Promise<DnaProperties> {
  //   if (!this._dnaProperties) {
  //     this._dnaProperties = await this.service.getProperties();
  //     console.log({dnaProperties: this._dnaProperties})
  //   }
  //   return this._dnaProperties;
  // }
  //
  ///** */
  // getMaybeProperties(): DnaProperties | undefined {
  //   return this._dnaProperties;
  // }


  /** */
  async pullAllFromDht() {
    /** Get Lists */
    const lists = await this.taskerZome.getAllLists();
    //console.log("pullAllFromDht:", lists)
    for (const listAh of lists) {
      const maybeList = await this.taskerZome.getTaskList(listAh);
      //console.log({maybeList})
      if (maybeList) {
        this.taskListStore[listAh] = maybeList
        // FIXME store each taskItem
      }
    }
    //console.log(this.taskListStore)

    /** Get Agents */
    await this.getAllAgents();
    console.log({agentStore: this.agentStore})
  }


  /** */
  async createTaskItem(title: string, assignee: AgentPubKeyB64, listAh: ActionHashB64): Promise<ActionHashB64> {
    return this.taskerZome.createTaskItem(title, assignee, listAh);
  }

  /** */
  async createTaskList(title: string): Promise<ActionHashB64> {
    return this.taskerZome.createTaskList(title);
  }

  async lockTaskList(listAh: ActionHashB64): Promise<ActionHashB64> {
    return this.taskerZome.lockTaskList(listAh);
  }

  async completeTask(taskAh: ActionHashB64): Promise<ActionHashB64> {
    return this.taskerZome.completeTask(taskAh);
  }

  async amIEditor(): Promise<boolean> {
    let claimed_membranes = await this.taskerZome.claimAllMembranes();
    console.log("Claimed membranes:", claimed_membranes)
    return this.taskerZome.amIEditor();
  }

  /** */
  async getTaskList(listAh: ActionHashB64): Promise<TaskList | null> {
    return this.taskerZome.getTaskList(listAh);
  }

  /** */
  async getAllAgents(): Promise<AgentPubKeyB64[]> {
    let agents = await this.agentDirectoryZome.getAllAgents();
    this.agentStore = agents.map((agentKey) => serializeHash(agentKey));
    return this.agentStore;
  }

}
