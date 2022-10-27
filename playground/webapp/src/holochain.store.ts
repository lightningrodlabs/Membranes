import {EntryHashB64, ActionHashB64, AgentPubKeyB64} from '@holochain-open-dev/core-types';
import {AgnosticClient, CellClient} from '@holochain-open-dev/cell-client';
import {HolochainService} from './holochain.service';
import {
  Dictionary, TaskItem,
  TaskItemEntry, TaskList,
} from './types';
import {CellId} from "@holochain/client";


const areEqual = (first: Uint8Array, second: Uint8Array) =>
      first.length === second.length && first.every((value, index) => value === second[index]);


/**
 *
 */
export class HolochainStore {

  /** Private */
  private service : HolochainService
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
    this.service = new HolochainService(client, cellId);
    //let cellClient = this.service.cellClient
    this.myAgentPubKey = this.service.myAgentPubKey;

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


  async pullAllFromDht() {
    /** Get Lists */
    const lists = await this.service.getAllLists();
    //console.log("pullAllFromDht:", lists)
    for (const listAh of lists) {
      const maybeList = await this.service.getTaskList(listAh);
      //console.log({maybeList})
      if (maybeList) {
        this.taskListStore[listAh] = maybeList
        // FIXME store each taskItem
      }
    }
    //console.log(this.taskListStore)
    /** Get Agents */
    this.agentStore = await this.service.getAllAgents();
    console.log({agentStore: this.agentStore})
  }


  /** */
  async createTaskItem(title: string, assignee: AgentPubKeyB64, listAh: ActionHashB64): Promise<ActionHashB64> {
    return this.service.createTaskItem(title, assignee, listAh);
  }

  /** */
  async createTaskList(title: string): Promise<ActionHashB64> {
    return this.service.createTaskList(title);
  }

  async lockTaskList(listAh: ActionHashB64): Promise<ActionHashB64> {
    return this.service.lockTaskList(listAh);
  }

  async completeTask(taskAh: ActionHashB64): Promise<ActionHashB64> {
    return this.service.completeTask(taskAh);
  }

  async amIEditor(): Promise<boolean> {
    let claimed_membranes = await this.service.claimAllMembranes();
    console.log("Claimed membranes:", claimed_membranes)
    return this.service.amIEditor();
  }

  /** */
  async getTaskList(listAh: ActionHashB64): Promise<TaskList | null> {
    return this.service.getTaskList(listAh);
  }

  /** */
  async getAllAgents(): Promise<AgentPubKeyB64[]> {
    return this.service.getAllAgents();
  }

}
