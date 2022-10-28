import {AgnosticClient} from '@holochain-open-dev/cell-client';

import {AgentPubKey, CellId} from "@holochain/client";

export class AgentDirectoryBridge {

  /** Ctor */
  constructor(public agnosticClient: AgnosticClient, public cellId: CellId /*, protected roleId: string*/) {}


  /** Zome API */

  async getAllAgents(): Promise<AgentPubKey[]> {
    return this.callZome('get_registered_agents', null);
  }


  /** Private */

  /** */
  private callZome(fn_name: string, payload: any): Promise<any> {
    //console.log("callZome: agent_directory." + fn_name + "() ", payload)
    //console.info({payload})
    try {
      const result = this.agnosticClient.callZome(this.cellId, "agent_directory", fn_name, payload, 10 * 1000);
      //console.log("callZome: agent_directory." + fn_name + "() result")
      //console.info({result})
      return result;
    } catch (e) {
      console.error("Calling zome agent_directory." + fn_name + "() failed: ")
      console.error({e})
    }
    return Promise.reject("callZome failed")
  }



}
