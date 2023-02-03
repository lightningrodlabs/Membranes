import { html } from "lit";
import {property, state} from "lit/decorators.js";
import {TaskerPage} from "./elements/tasker-page";
import {
  VouchDashboard,
  MembranesDashboard,
  MembranesCreatorPage,
  CreateEntryDashboard, CreateVouchThreshold, CreateCecThreshold,
} from "@membranes/elements";
import {AgentDirectoryList} from "@ddd-qc/agent-directory";
import { TaskerDvm } from "./viewModel/tasker.dvm";
import {
  HvmDef, HappElement, HCL, ViewCellContext, CellDef, CellContext, delay, Cell
} from "@ddd-qc/lit-happ";
import {AdminWebsocket, AgentPubKeyB64, DnaDefinition, RoleName} from "@holochain/client";


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
  taskerDvmClone(cloneId: RoleName): TaskerDvm { return this.hvm.getDvm(new HCL(this.hvm.appId, TaskerDvm.DEFAULT_BASE_ROLE_NAME, cloneId))! as TaskerDvm }

  /** -- Fields -- */

  @state() private _loaded = false;

  private _pageDisplayIndex: number = 0;
  /** ZomeName -> (AppEntryDefName, isPublic) */
  private _allAppEntryTypes: Record<string, [string, boolean][]> = {};


  @state() private _cell?: Cell;


  private _dnaDef?: DnaDefinition;

  /** */
  async happInitialized() {
    console.log("happInitialized()")
    //new ContextProvider(this, cellContext, this.taskerDvm.cell);
    /** Authorize all zome calls */
    const adminWs = await AdminWebsocket.connect(`ws://localhost:${process.env.ADMIN_PORT}`);
    console.log({adminWs});
    await this.hvm.authorizeAllZomeCalls(adminWs);
    console.log("*** Zome call authorization complete");
    this._dnaDef = await adminWs.getDnaDefinition(this.taskerDvm.cell.id[0]);
    console.log("happInitialized() dnaDef", this._dnaDef);
    /** Probe */    
    this._cell = this.taskerDvm.cell;
    await this.hvm.probeAll();
    this._allAppEntryTypes = await this.taskerDvm.fetchAllEntryDefs();
    console.log("happInitialized(), _allAppEntryTypes", this._allAppEntryTypes);
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
      cloneName: "My Kingdom",
      modifiers: {
        properties: {
          progenitors: [this.taskerDvm.cell.agentPubKey],
        },
      }
    }
    await this.createClone(TaskerDvm.DEFAULT_BASE_ROLE_NAME, cellDef);
    console.log({clones: this.taskerDvmClones});
    const myWorldDvm = this.taskerDvmClone(TaskerDvm.DEFAULT_BASE_ROLE_NAME + '.0');
    this._cell = myWorldDvm.cell;
  }


  /** */
  render() {
    console.log("*** <tasker-app> render()", this._loaded, this.taskerDvm.membranesZvm.perspective)
    if (!this._loaded) {
      return html`<span>Loading...</span>`;
    }
    let knownAgents: AgentPubKeyB64[] = this.taskerDvm.AgentDirectoryZvm.perspective.agents;
    //console.log({coordinator_zomes: this._dnaDef?.coordinator_zomes})
    const zomeNames = this._dnaDef?.coordinator_zomes.map((zome) => { return zome[0]; });
    console.log({zomeNames})
    let page;
    switch (this._pageDisplayIndex) {
      case 0: page = html`<tasker-page style="flex: 1;"></tasker-page>` ; break;
      case 1: page = html`<membranes-dashboard .allAppEntryTypes=${this._allAppEntryTypes} style="flex: 1;"></membranes-dashboard>`; break;
      case 2: page = html`<membranes-creator-page .allAppEntryTypes=${this._allAppEntryTypes} style="flex: 1;"></membranes-creator-page>`; break;
      case 3: page = html`<vouch-dashboard .knownAgents=${knownAgents} style="flex: 1;"></vouch-dashboard>`; break;
      case 4: page = html`<create-entry-dashboard .knownAgents=${knownAgents} .zomeIndexes="${this._dnaDef?.coordinator_zomes}" .allAppEntryTypes=${this._allAppEntryTypes} style="flex: 1;"></create-entry-dashboard>`; break;
      case 5: page = html`<create-vouch-threshold style="flex: 1;"></create-vouch-threshold>`; break;
      case 6: page = html`<create-cec-threshold .allAppEntryTypes=${this._allAppEntryTypes} .zomeNames=${zomeNames} style="flex: 1;"></create-cec-threshold>`; break;
      case 7: page = html`<agent-directory-list style="flex: 1;"></agent-directory-list>`; break;

      default: page = html`unknown page index`;
    };

    /* render all */
    return html`
      <cell-context .cell="${this._cell}">
        <div>
          <view-cell-context></view-cell-context>
          <input type="button" value="Tasker" @click=${() => {this._pageDisplayIndex = 0; this.requestUpdate()}} >
          <input type="button" value="Membranes Dashboard" @click=${() => {this._pageDisplayIndex = 1; this.requestUpdate()}} >
          <input type="button" value="Membranes Creator" @click=${() => {this._pageDisplayIndex = 2; this.requestUpdate()}} >
          <input type="button" value="Vouch Dashboard" @click=${() => {this._pageDisplayIndex = 3; this.requestUpdate()}} >
          <input type="button" value="CreateEntry Dashboard" @click=${() => {this._pageDisplayIndex = 4; this.requestUpdate()}} >
          <input type="button" value="Create Vouch Threshold" @click=${() => {this._pageDisplayIndex = 5; this.requestUpdate()}} >
          <input type="button" value="Create CEC Threshold" @click=${() => {this._pageDisplayIndex = 6; this.requestUpdate()}} >
          <input type="button" value="Agent Directory" @click=${() => {this._pageDisplayIndex = 7; this.requestUpdate()}} >
        </div>
        <input type="button" value="Make me king!" @click=${() => {this.cloneTasker()}}>
        <button type="button" @click=${this.refresh}>Refresh</button>
        <span><b>Agent:</b> ${this.taskerDvm.cell.agentPubKey}</span>
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
      "create-vouch-threshold": CreateVouchThreshold,
      "create-cec-threshold": CreateCecThreshold,
      "create-entry-dashboard": CreateEntryDashboard,
      "agent-directory-list": AgentDirectoryList,
      "view-cell-context": ViewCellContext,
      "cell-context": CellContext,
    };
  }
}
