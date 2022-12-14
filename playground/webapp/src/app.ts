import { html } from "lit";
import {property, state} from "lit/decorators.js";
import {TaskerPage} from "./elements/tasker-page";
import {
  VouchDashboard,
  MembranesDashboard,
  MembranesCreatorPage,
  CreateEntryDashboard,
} from "@membranes/elements";
import {AgentPubKeyB64, Dictionary} from "@holochain-open-dev/core-types";
import {AgentDirectoryList} from "@ddd-qc/agent-directory";
import { TaskerDvm } from "./viewModel/tasker.dvm";
import {
  HvmDef, HappElement, CloneIndex, HCL, ViewCellContext, CellDef, CellContext
} from "@ddd-qc/lit-happ";
import {InstalledCell} from "@holochain/client";


/**
 *
 */
export class TaskerApp extends HappElement {

  /** Ctor */
  constructor() {
    super(Number(process.env.HC_PORT));
  }

  /** HvmDef */
  static readonly HVM_DEF: HvmDef = {
    id: "hTasker",
    dvmDefs: [{ctor: TaskerDvm, isClonable: true}],
  };

  /** QoL */
  get taskerDvm(): TaskerDvm { return this.hvm.getDvm(TaskerDvm.DEFAULT_BASE_ROLE_NAME)! as TaskerDvm }
  get taskerDvmClones(): TaskerDvm[] {return this.hvm.getClones(TaskerDvm.DEFAULT_BASE_ROLE_NAME)! as TaskerDvm[]}
  taskerDvmClone(index: CloneIndex): TaskerDvm { return this.hvm.getDvm(new HCL(this.hvm.appId, TaskerDvm.DEFAULT_BASE_ROLE_NAME, index))! as TaskerDvm }

  /** -- Fields -- */

  @state() private _loaded = false;

  private _pageDisplayIndex: number = 0;
  /** ZomeName -> (AppEntryDefName, isPublic) */
  private _allAppEntryTypes: Dictionary<[string, boolean][]> = {};


  @state() private _installedCell?: InstalledCell;


  /** */
  async happInitialized() {
    console.log("happInitialized()")
    //new ContextProvider(this, cellContext, this.taskerDvm.installedCell);
    this._installedCell = this.taskerDvm.installedCell;
    await this.hvm.probeAll();

    this._allAppEntryTypes = await this.taskerDvm.fetchAllEntryDefs();

    /** Done */
    this._loaded = true;
  }


  /** */
  async refresh(_e?: any) {
    console.log("tasker-app.refresh() called")
    await this.hvm.probeAll();
  }


  /** */
  async cloneTasker() {
    const cellDef: CellDef = {
      modifiers: {
        properties: {
          progenitors: [this.taskerDvm.agentPubKey],
        },
      }
    }
    await this.createClone(TaskerDvm.DEFAULT_BASE_ROLE_NAME, cellDef);
    const myWorldDvm = this.taskerDvmClone(0);
    this._installedCell = myWorldDvm.installedCell;
  }


  /** */
  render() {
    console.log("<tasker-app> render()", this._loaded)
    if (!this._loaded) {
      return html`<span>Loading...</span>`;
    }
    let knownAgents: AgentPubKeyB64[] = this.taskerDvm.AgentDirectoryZvm.perspective.agents;

    let page;
    switch (this._pageDisplayIndex) {
      case 0: page = html`<tasker-page style="flex: 1;"></tasker-page>` ; break;
      case 1: page = html`<membranes-dashboard .allAppEntryTypes=${this._allAppEntryTypes} style="flex: 1;"></membranes-dashboard>`; break;
      case 2: page = html`<membranes-creator-page .allAppEntryTypes=${this._allAppEntryTypes} style="flex: 1;"></membranes-creator-page>`; break;
      case 3: page = html`<vouch-dashboard .knownAgents=${knownAgents} style="flex: 1;"></vouch-dashboard>`; break;
      case 4: page = html`<create-entry-dashboard .knownAgents=${knownAgents} .allAppEntryTypes=${this._allAppEntryTypes} style="flex: 1;"></create-entry-dashboard>`; break;
      case 5: page = html`<agent-directory-list style="flex: 1;"></agent-directory-list>`; break;

      default: page = html`unknown page index`;
    };

    /* render all */
    return html`
      <cell-context .installedCell="${this._installedCell}">
        <div>
          <view-cell-context></view-cell-context>
          <input type="button" value="Tasker" @click=${() => {this._pageDisplayIndex = 0; this.requestUpdate()}} >
          <input type="button" value="Membranes Dashboard" @click=${() => {this._pageDisplayIndex = 1; this.requestUpdate()}} >
          <input type="button" value="Membranes Creator" @click=${() => {this._pageDisplayIndex = 2; this.requestUpdate()}} >
          <input type="button" value="Vouch Dashboard" @click=${() => {this._pageDisplayIndex = 3; this.requestUpdate()}} >
          <input type="button" value="CreateEntry Dashboard" @click=${() => {this._pageDisplayIndex = 4; this.requestUpdate()}} >
          <input type="button" value="Agent Directory" @click=${() => {this._pageDisplayIndex = 5; this.requestUpdate()}} >
        </div>
        <input type="button" value="Make me king!" @click=${() => {this.cloneTasker()}}>
        <button type="button" @click=${this.refresh}>Refresh</button>
        <span><b>Agent:</b> ${this.taskerDvm.agentPubKey}</span>
        <hr class="solid">      
        ${page}
      </cell-context>        
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
      "view-cell-context": ViewCellContext,
      "cell-context": CellContext,
    };
  }
}
