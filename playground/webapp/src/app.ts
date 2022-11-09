import { LitElement, html } from "lit";
import { state } from "lit/decorators.js";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {CellId, InstalledCell} from "@holochain/client";
import {HolochainClient} from "@holochain-open-dev/cell-client";
import {ContextProvider} from "@lit-labs/context";

import {AppWebsocket} from "@holochain/client";

import {TaskerPage} from "./elements/tasker-page";
import {TaskerViewModel, taskerContext} from "./tasker.vm";
import {
  VouchDashboard,
  MembranesDashboard,
  MembranesViewModel,
  membranesContext,
  MembranesCreatorPage,
  MembraneThresholdEntry,
  CreateEntryDashboard,
} from "@membranes/elements";
import {Dictionary} from "@holochain-open-dev/core-types";
import {agentDirectoryContext, AgentDirectoryViewModel, AgentDirectoryList} from "@ddd-qc/agent-directory";
import {serializeHash} from "@holochain-open-dev/utils";

let APP_ID = 'tasker'
let HC_PORT:any = process.env.HC_PORT;
let NETWORK_ID: any = null

console.log("HC_PORT = " + HC_PORT + " || " + process.env.HC_PORT);


/** */
export class TaskerApp extends ScopedElementsMixin(LitElement) {

  @state() loaded = false;

  private _taskerViewModel: TaskerViewModel | null = null;
  private _membranesViewModel: MembranesViewModel | null = null;
  private _agentDirectoryViewModel: AgentDirectoryViewModel | null = null;

  private _pageDisplayIndex: number = 0;

  myAgentPubKey = ""

  /** ZomeName -> (AppEntryDefName, isPublic) */
  appEntryTypeStore: Dictionary<[string, boolean][]> = {};


  /** */
  async getEntryDefs(hcClient: HolochainClient, cellId: CellId, zomeName: string): Promise<[string, boolean][]> {
    try {
      const entryDefs = await hcClient.callZome(cellId, zomeName, "entry_defs", null, 10 * 1000);
      console.debug("getEntryDefs() for " + zomeName + " result:")
      console.log({entryDefs})
      let result: [string, boolean][] = []
      for (const def of entryDefs.Defs) {
        const name = def.id.App;
        result.push([name, def.visibility.hasOwnProperty('Public') ])
      }
      console.log({result})
      return result;
    } catch (e) {
      console.error("Calling getEntryDefs() on " + zomeName + " failed: ")
      console.error({e})
    }
    return [];
  }

  /** */
  async getDnaInfo(hcClient: HolochainClient, cellId: CellId, zomeName: string): Promise<string[]> {
    console.debug("getDnaInfo() for " + zomeName + " ...")
    const dnaInfo = await hcClient.callZome(cellId, zomeName, "dna_info_hack", null, 10 * 1000);
    //const result = this.client.callZome(this.mainCellId, zomeName, "entry_defs", null, 10 * 1000);
    console.debug("getDnaInfo() for " + zomeName + " result:")
    console.debug({dnaInfo})

    //const zomeInfo = await hcClient.callZome(cellId, zomeName, "zome_info", null, 10 * 1000);
    //console.debug("zomeInfo() for " + zomeName + " result:")
    //console.debug({zomeInfo})

    return dnaInfo as string[];
  }


  /** */
  async firstUpdated() {
    await this.init();
  }

  async init() {
    const wsUrl = `ws://localhost:${HC_PORT}`
    const installed_app_id = NETWORK_ID == null || NETWORK_ID == ''
      ? APP_ID
      : APP_ID + '-' + NETWORK_ID;
    console.log({installed_app_id})

    const appWebsocket = await AppWebsocket.connect(wsUrl);
    console.log({appWebsocket})
    const hcClient = new HolochainClient(appWebsocket)
    /** Setup Tasker */
    const appInfo = await hcClient.appWebsocket.appInfo({installed_app_id});
    const taskerCellId  = appInfo.cell_data[0].cell_id;
    this._taskerViewModel = new TaskerViewModel(hcClient, taskerCellId);
    new ContextProvider(this, taskerContext, this._taskerViewModel);
    this._agentDirectoryViewModel = new AgentDirectoryViewModel(hcClient, taskerCellId);
    new ContextProvider(this, agentDirectoryContext, this._agentDirectoryViewModel);
    this._membranesViewModel = new MembranesViewModel(hcClient, taskerCellId);
    new ContextProvider(this, membranesContext, this._membranesViewModel);
    /** */
    const cells = Object.values(appInfo.cell_data);
    for (const cell of cells) {
      this.myAgentPubKey = serializeHash(cell.cell_id[1]);
      let dnaInfo = await this.getDnaInfo(hcClient, cell.cell_id, "membranes");
      for (const zomeName of dnaInfo) {
        this.appEntryTypeStore[zomeName] = await this.getEntryDefs(hcClient, cell.cell_id, zomeName);
      }
    }
    /** Done */
    this.loaded = true;
  }


  /** */
  async refresh(_e?: any) {
    await this._taskerViewModel!.pullAllFromDht();
    await this._agentDirectoryViewModel!.pullAllFromDht();
    await this._membranesViewModel!.pullAllFromDht();
  }


  render() {
    console.log("tasker-app render() called!")
    if (!this.loaded) {
      return html`<span>Loading...</span>`;
    }

    let page;
    switch (this._pageDisplayIndex) {
      case 0: page = html`<tasker-page style="flex: 1;"></tasker-page>` ; break;
      case 1: page = html`<membranes-dashboard .appEntryTypeStore=${this.appEntryTypeStore} style="flex: 1;"></membranes-dashboard>`; break;
      case 2: page = html`<membranes-creator-page .appEntryTypeStore=${this.appEntryTypeStore} style="flex: 1;"></membranes-creator-page>`; break;
      case 3: page = html`<vouch-dashboard .knownAgents=${this._agentDirectoryViewModel?.agents()} style="flex: 1;"></vouch-dashboard>`; break;
      case 4: page = html`<create-entry-dashboard .knownAgents=${this._agentDirectoryViewModel?.agents()} .appEntryTypeStore=${this.appEntryTypeStore} style="flex: 1;"></create-entry-dashboard>`; break;
      case 5: page = html`<agent-directory-list style="flex: 1;"></agent-directory-list>`; break;

      default: page = html`unknown page index`;
    };

    return html`
      <div>
        <input type="button" value="Tasker" @click=${() => {this._pageDisplayIndex = 0; this.requestUpdate()}} >
        <input type="button" value="Membranes Dashboard" @click=${() => {this._pageDisplayIndex = 1; this.requestUpdate()}} >
        <input type="button" value="Membranes Creator" @click=${() => {this._pageDisplayIndex = 2; this.requestUpdate()}} >
        <input type="button" value="Vouch Dashboard" @click=${() => {this._pageDisplayIndex = 3; this.requestUpdate()}} >
        <input type="button" value="CreateEntry Dashboard" @click=${() => {this._pageDisplayIndex = 4; this.requestUpdate()}} >
        <input type="button" value="Agent Directory" @click=${() => {this._pageDisplayIndex = 5; this.requestUpdate()}} >
      </div>
      <button type="button" @click=${this.refresh}>Refresh</button>
      <span><b>Agent:</b> ${this.myAgentPubKey}</span>
      <hr class="solid">      
      ${page}
    `
  }


  static get scopedElements() {
    return {
      "tasker-page": TaskerPage,
      "membranes-dashboard": MembranesDashboard,
      "membranes-creator-page": MembranesCreatorPage,
      "vouch-dashboard": VouchDashboard,
      "create-entry-dashboard": CreateEntryDashboard,
      "agent-directory-list": AgentDirectoryList,
    };
  }
}
