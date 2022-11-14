import { LitElement, html } from "lit";
import { state } from "lit/decorators.js";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {CellId} from "@holochain/client";
import {HolochainClient} from "@holochain-open-dev/cell-client";
import {TaskerPage} from "./elements/tasker-page";
import {TaskerViewModel} from "./tasker.vm";
import {
  VouchDashboard,
  MembranesDashboard,
  MembranesViewModel,
  MembranesCreatorPage,
  MembraneThresholdEntry,
  CreateEntryDashboard,
} from "@membranes/elements";
import {AgentPubKeyB64, Dictionary} from "@holochain-open-dev/core-types";
import {AgentDirectoryViewModel, AgentDirectoryList, AgentDirectoryPerspective} from "@ddd-qc/agent-directory";
import {DnaViewModel} from "@ddd-qc/dna-client";

let APP_ID = 'tasker'
let HC_PORT:any = process.env.HC_PORT;

console.log("HC_PORT = " + HC_PORT + " || " + process.env.HC_PORT);


/**
 *
 */
export class TaskerApp extends ScopedElementsMixin(LitElement) {

  @state() private _loaded = false;

  private _dnaViewModel!: DnaViewModel;


  private _pageDisplayIndex: number = 0;
  /** ZomeName -> (AppEntryDefName, isPublic) */
  //private _allAppEntryTypes: Dictionary<[string, boolean][]> = {};


  // /** */
  // async getEntryDefs(hcClient: HolochainClient, cellId: CellId, zomeName: string): Promise<[string, boolean][]> {
  //   try {
  //     const entryDefs = await hcClient.callZome(cellId, zomeName, "entry_defs", null, 10 * 1000);
  //     console.debug("getEntryDefs() for " + zomeName + " result:")
  //     console.log({entryDefs})
  //     let result: [string, boolean][] = []
  //     for (const def of entryDefs.Defs) {
  //       const name = def.id.App;
  //       result.push([name, def.visibility.hasOwnProperty('Public') ])
  //     }
  //     console.log({result})
  //     return result;
  //   } catch (e) {
  //     console.error("Calling getEntryDefs() on " + zomeName + " failed: ")
  //     console.error({e})
  //   }
  //   return [];
  // }


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


  /** */
  async init() {
    let HC_PORT:any = process.env.HC_PORT;
    this._dnaViewModel = await DnaViewModel.new(this, HC_PORT, APP_ID);
    await this._dnaViewModel.addZomeViewModel(TaskerViewModel)
    await this._dnaViewModel.addZomeViewModel(AgentDirectoryViewModel)
    await this._dnaViewModel.addZomeViewModel(MembranesViewModel)
    await this._dnaViewModel.probeAll();

    /** Get all EntryDefs for each zome of each DNA */
    // const cells = Object.values(appInfo.cell_data);
    // for (const cell of cells) {
    //   //this.myAgentPubKey = serializeHash(cell.cell_id[1]);
    //   let dnaInfo = await this.getDnaInfo(hcClient, cell.cell_id, "membranes");
    //   for (const zomeName of dnaInfo) {
    //     this._allAppEntryTypes[zomeName] = await this.getEntryDefs(hcClient, cell.cell_id, zomeName);
    //   }
    // }

    //this._allAppEntryTypes = this._dnaViewModel.entryTypes


    /** Done */
    this._loaded = true;
  }


  /** */
  async refresh(_e?: any) {
    console.log("tasker-app.refresh() called")
    await this._dnaViewModel.probeAll();
  }


  /** */
  render() {
    console.log("tasker-app render() called!")
    if (!this._loaded) {
      return html`<span>Loading...</span>`;
    }
    let knownAgents: AgentPubKeyB64[] = [];
    const maybeZvm = this._dnaViewModel.getViewModel("agent_directory");
    if (maybeZvm) {
      const zvm = maybeZvm as unknown as AgentDirectoryViewModel;
      knownAgents = zvm.perspective.agents;
    }

    let page;
    switch (this._pageDisplayIndex) {
      case 0: page = html`<tasker-page style="flex: 1;"></tasker-page>` ; break;
      case 1: page = html`<membranes-dashboard .allAppEntryTypes=${this._dnaViewModel.entryTypes} style="flex: 1;"></membranes-dashboard>`; break;
      case 2: page = html`<membranes-creator-page .allAppEntryTypes=${this._dnaViewModel.entryTypes} style="flex: 1;"></membranes-creator-page>`; break;
      case 3: page = html`<vouch-dashboard .knownAgents=${knownAgents} style="flex: 1;"></vouch-dashboard>`; break;
      case 4: page = html`<create-entry-dashboard .knownAgents=${knownAgents} .allAppEntryTypes=${this._dnaViewModel.entryTypes} style="flex: 1;"></create-entry-dashboard>`; break;
      case 5: page = html`<agent-directory-list style="flex: 1;"></agent-directory-list>`; break;

      default: page = html`unknown page index`;
    };

    /* render all */
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
      <span><b>Agent:</b> ${this._dnaViewModel!.myAgentPubKey}</span>
      <hr class="solid">      
      ${page}
    `
  }

  /** */
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
