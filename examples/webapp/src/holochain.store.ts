import {EntryHashB64, ActionHashB64, AgentPubKeyB64} from '@holochain-open-dev/core-types';
import {AgnosticClient, CellClient} from '@holochain-open-dev/cell-client';
import {HolochainService} from './holochain.service';
import {
  TaskItemEntry,
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
  taskListStore: Dictionary<SnapshotEntry> = {};
  /** ActionHash -> TaskItem */
  taskItemStore: Dictionary<PlacementDetails[]> = {};





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
  async storeTaskList(snapshot: SnapshotEntry, authors: AgentPubKeyB64[]) {
    console.log(`storeSnapshot() called for ${snapshot.timeBucketIndex}`)
    this.snapshotStore[snapshot.timeBucketIndex] = snapshot
    this.publisherStore[snapshot.timeBucketIndex] = authors
    // this.snapshotStore.update(store => {
    //   store[snapshot.timeBucketIndex] = snapshot
    //   return store
    // })
    if (this.latestStoredBucketIndex < snapshot.timeBucketIndex) {
      this.latestStoredBucketIndex = snapshot.timeBucketIndex
    }
    //console.log(`Snapshot stored at bucket ${snapshot.timeBucketIndex}`)
  }


  /** */
  async storePlacements(placements: PlacementEntry[], index: number) {
    //     const placements = await this.service.getPlacementsAt(index);
    let details: PlacementDetails[] = []
    for (const placement of placements) {
      let author = await this.service.getPlacementAuthor(placement.pixel, index);
      author = author? author : "<unknown>"
      details.push({placement: destructurePlacement(placement), author})
    }
    this.placementStore[index] = details
    // this.placementStore.update(store => {
    //   store[snapshot.timeBucketIndex - 1] = placements
    //   return store
    // })
    console.log(`Placements stored at bucket ${index} ; new placement(s): ${Object.keys(placements).length}`)
  }


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
  async placePixel(destructured: DestructuredPlacement): Promise<ActionHashB64> {
    return this.service.placePixel(destructured);
  }


  /** */
  async getPlacementsAt(bucketIndex: number): Promise<PlacementEntry[]> {
    let placements = await this.service.getPlacementsAt(bucketIndex);
    await this.storePlacements(placements, bucketIndex);
    return placements;
  }


  /** */
  async publishNextSnapshotAt(bucket_index: number): Promise<ActionHashB64 | null> {
    console.log("publishNextSnapshotAt() " + bucket_index)
    let res = await this.service.publishNextSnapshotAt(bucket_index);
    console.log("publishNextSnapshotAt() succeeded = " + res != null)
    await this.pullLatestSnapshotFromDht();
    return res;
  }


  /** */
  async publishSameSnapshotUpto(latestKnownBucket: number, nowBucket: number): Promise<ActionHashB64[]> {
    console.log("publishSameSnapshotUpto() " + latestKnownBucket + " .. " + nowBucket);
    let res = await this.service.publishSameSnapshotUpto(latestKnownBucket, nowBucket);
    console.log("publishSameSnapshotUpto() succeeded = " + res != null)
    await this.pullLatestSnapshotFromDht();
    return res;
  }




  /** */
  getMyRankAt(bucketIndex: number): number {
    return this.myRankStore[bucketIndex]
  }

  /** */
  getPublishersAt(bucketIndex: number): AgentPubKeyB64[] {
    return this.publisherStore[bucketIndex]
  }

  /** */
  async getMyRenderTime(bucketIndex: number): Promise<number> {
    const bucketSize = this.getMaybeProperties()!.bucketSizeSec;
    const nextBucketTime = (bucketIndex + 1) * bucketSize;
    const rank = await this.service.getAuthorRank(this.myAgentPubKey, bucketIndex - 1); // Must get rank of previous bucket to determine this bucket's render time
    this.myRankStore[bucketIndex] = rank
    const offset = (rank - 1) * (bucketSize / 10)
    //console.log("MyRank for " + this.getRelativeBucketIndex(bucketIndex) + ", is: " + rank + "; offset = " + offset + " secs")
    if (rank == 0) {
      return nextBucketTime - 2;
    }
    const rankTime = bucketIndex * bucketSize + offset
    return Math.min(nextBucketTime - 2, rankTime)
  }


}
