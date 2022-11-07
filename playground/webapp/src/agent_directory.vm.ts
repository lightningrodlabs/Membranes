import {AgentPubKeyB64} from '@holochain-open-dev/core-types';
import {AgnosticClient} from '@holochain-open-dev/cell-client';
import {CellId} from "@holochain/client";
import {serializeHash} from "@holochain-open-dev/utils";
import {AgentDirectoryBridge} from "./agent_directory.bridge";
import {createContext} from "@lit-labs/context";


export const agentDirectoryContext = createContext<AgentDirectoryViewModel>('agent_directory/service');


/** */
export class AgentDirectoryViewModel {

  /** Private */
  private agentDirectoryBridge : AgentDirectoryBridge
  //private _dnaProperties?: DnaProperties;


  /** Public */
  agentStore: AgentPubKeyB64[] = []
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  //public snapshots: Readable<Dictionary<SnapshotEntry>> = derived(this.snapshotStore, i => i)
  //public placements: Readable<Dictionary<PlacementEntry[]>> = derived(this.placementStore, i => i)


  /** Ctor */
  constructor(protected client: AgnosticClient, cellId: CellId) {
    this.agentDirectoryBridge = new AgentDirectoryBridge(client, cellId);
    this.myAgentPubKey = serializeHash(cellId[1]);
  }

  /** */
  async pullAllRegisteredAgents(): Promise<AgentPubKeyB64[]> {
    let agents = await this.agentDirectoryBridge.getAllAgents();
    this.agentStore = agents.map((agentKey) => serializeHash(agentKey));
    return this.agentStore;
  }

}
