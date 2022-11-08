import {AgentPubKeyB64, Dictionary} from '@holochain-open-dev/core-types';
import {AgnosticClient} from '@holochain-open-dev/cell-client';
import {CellId} from "@holochain/client";
import {serializeHash} from "@holochain-open-dev/utils";
import {AgentDirectoryBridge} from "./agent_directory.bridge";
import {createContext} from "@lit-labs/context";
import {LitElement} from "lit";
import {writable, Writable, get} from "svelte/store";
import {TaskListEntry} from "./tasker.types";


export const agentDirectoryContext = createContext<AgentDirectoryViewModel>('agent_directory/service');


/** */
export class AgentDirectoryViewModel {
  /** Ctor */
  constructor(protected client: AgnosticClient, cellId: CellId) {
    this._bridge = new AgentDirectoryBridge(client, cellId);
    this.myAgentPubKey = serializeHash(cellId[1]);
    // this.bridge.getProperties().then((properties) => {
    //   this.latestBucketIndex = Math.floor(properties.startTime / properties.bucketSizeSec) - 1;
    // });
  }

  /** Private */
  private _bridge : AgentDirectoryBridge
  //private _dnaProperties?: DnaProperties;

  private _agentStore: Writable<AgentPubKeyB64[]> = writable([]);

  /** Public */
  //agentStore: AgentPubKeyB64[] = []
  myAgentPubKey: AgentPubKeyB64;


  agents(): AgentPubKeyB64[] {
    return get(this._agentStore);
  }


  subscribe(parent: LitElement) {
    this._agentStore.subscribe((value) => {
      //console.log("localTaskListStore update called");
      parent.requestUpdate();
    });
  }


  /** */
  async pullAllFromDht() {
    await this.pullAllRegisteredAgents();
  }


  /** */
  async pullAllRegisteredAgents() {
    let agents = await this._bridge.getAllAgents();
    this._agentStore.update(store => {
      store = agents.map((agentKey) => serializeHash(agentKey));
      return store;
    })
  }

}
