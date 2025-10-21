import {css, html} from "lit";
import {customElement, state} from "lit/decorators.js";
import { TaskerDvm } from "./viewModel/tasker.dvm";
import {
    HvmDef, HappElement, HCL, CellDef, Cell, AgentId
} from "@ddd-qc/lit-happ";
import {AdminWebsocket, DnaDefinition, RoleName} from "@holochain/client";


/**
 *
 */
@customElement("tasker-app")
export class TaskerApp extends HappElement {

    /** HvmDef */
    static override readonly HVM_DEF: HvmDef = {
        id: "hTasker",
        dvmDefs: [{ctor: TaskerDvm, isClonable: true}],
    };

    /** All arguments should be provided when constructed explicity */
    // @ts-ignore
    constructor(appWs?: AppWebsocket, private adminWs?: AdminWebsocket, readonly appId?: InstalledAppId, public _appletView?: AppletView) {
        /** Figure out arguments for super() */
        const appPort: number = Number(process.env.HC_APP_PORT);
        const adminUrl = adminWs
            ? undefined
            : process.env.HC_ADMIN_PORT
                ? new URL(`ws://localhost:${process.env.HC_ADMIN_PORT}`)
                : undefined;
        super(appWs? appWs : appPort, appId, adminUrl, 10 * 1000);
    }

  /** QoL */
  get taskerDvm(): TaskerDvm { return this.hvm.getDvm(TaskerDvm.DEFAULT_BASE_ROLE_NAME)! as TaskerDvm }
  get taskerDvmClones(): TaskerDvm[] {return this.hvm.getClones(TaskerDvm.DEFAULT_BASE_ROLE_NAME)! as TaskerDvm[]}
  taskerDvmClone(cloneId: RoleName): TaskerDvm { return this.hvm.getDvm(new HCL(this.hvm.appId, TaskerDvm.DEFAULT_BASE_ROLE_NAME, cloneId))! as TaskerDvm }


  /** -- Fields -- */

  @state() private _loaded = false;

  private _pageDisplayIndex: number = 0;

  @state() private _cell?: Cell;


  private _dnaDef?: DnaDefinition;

  /** */
  override async hvmConstructed() {
    console.log("hvmConstructed()");
    this.appProxy.getCellProxy(this.taskerDvm.taskerZvm.cell.address).setCanThrottle(false);
    this.appProxy.getCellProxy(this.taskerDvm.membranesZvm.cell.address).setCanThrottle(false);

    //new ContextProvider(this, cellContext, this.taskerDvm.cell);
    /** Authorize all zome calls */
    const adminWs = await AdminWebsocket.connect({ url: new URL(`ws://localhost:${process.env.HC_ADMIN_PORT}`)});
    console.log({adminWs});
    await this.hvm.authorizeAllZomeCalls(adminWs);
    console.log("*** Zome call authorization complete");
    this._dnaDef = await adminWs.getDnaDefinition(this.taskerDvm.cell.address.dnaId.hash);
    console.log("happInitialized() dnaDef", this._dnaDef);
    /** Probe */    
    this._cell = this.taskerDvm.cell;
    this.hvm.probeAll();
    console.log("happInitialized() allEntryDefs", this.taskerDvm.allEntryDefs);
    // TODO: Fix issue: zTasker entry_defs() not found. Maybe confusion with integrity zome name?
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
          progenitors: [this.taskerDvm.cell.address.agentId.b64],
        },
      }
    }
    await this.createClone(TaskerDvm.DEFAULT_BASE_ROLE_NAME, cellDef);
    console.log({clones: this.taskerDvmClones});
    const myWorldDvm = this.taskerDvmClone(TaskerDvm.DEFAULT_BASE_ROLE_NAME + '.0');
    this._cell = myWorldDvm.cell;
  }


  /** */
  override render() {
    console.log("*** <tasker-app> render()", this._loaded, this.taskerDvm.membranesZvm.perspective)
    if (!this._loaded) {
      return html`<span>Loading...</span>`;
    }
    let knownAgents: AgentId[] = this.taskerDvm.AgentDirectoryZvm.perspective.agents;
    //console.log({coordinator_zomes: this._dnaDef?.coordinator_zomes})
    const zomeNames = this._dnaDef?.coordinator_zomes.map((zome) => { return zome[0]; });
    console.log({zomeNames})
    let page;
    switch (this._pageDisplayIndex) {
      case 0: page = html`<tasker-page style="flex: 1;"></tasker-page>` ; break;
      case 1: page = html`<membranes-dashboard style="flex: 1;"></membranes-dashboard>`; break;
      case 2: page = html`<membranes-creator-page style="flex: 1;"></membranes-creator-page>`; break;
      case 3: page = html`<vouch-dashboard .knownAgents=${knownAgents} style="flex: 1;"></vouch-dashboard>`; break;
      case 4: page = html`<create-entry-dashboard .knownAgents=${knownAgents} .zomeIndexes="${this._dnaDef?.coordinator_zomes}" style="flex: 1;"></create-entry-dashboard>`; break;
      case 5: page = html`<create-vouch-threshold style="flex: 1;"></create-vouch-threshold>`; break;
      case 6: page = html`<create-cec-threshold .zomeNames=${zomeNames} style="flex: 1;"></create-cec-threshold>`; break;
      case 7: page = html`<agent-directory-list style="flex: 1;"></agent-directory-list>`; break;

      default: page = html`unknown page index`;
    }

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
            <button type="button" @click=${async () => {
                this.taskerDvm.dumpCallLogs();
                this.taskerDvm.dumpSignalLogs();
                this.networkCaller?.dumpNetworkMetricsLogs();
            }}>dump</button>
            <input type="button" value="Loop networkInfos" @click=${async (_e:any) => {
                console.log("networkInfos:", this.networkCaller?.isLooping(), this.networkCaller, this.taskerDvm.cell.address)
                this.networkCaller?.setCellAddr(this.taskerDvm.cell.address)
                if (!this.networkCaller?.isLooping()) {
                    console.log("Start loop");
                    //this.networkCaller?.addCallback((info: NetworkMetrics) => {console.log(info)})
                    await this.networkCaller?.startCallLoop(1000);
                } else {
                    this.networkCaller?.stopCallLoop();
                    this.networkCaller?.clearAllCallbacks();
                }
            }}>
        </div>
        <input type="button" value="Make me king!" @click=${() => {this.cloneTasker()}}>
        <button type="button" @click=${this.refresh}>Refresh</button>
        <span><b>Agent:</b> ${this.taskerDvm.cell.address.agentId.short}</span>
        <hr class="solid">      
        ${page}
      </cell-context>        
    `
  }

    /** */
    static override get styles() {
        return [
          css`
                //:host {
                //  margin-bottom: 50px;
                //}
            `
        ]
    }
}
