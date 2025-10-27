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
    this._dnaDef = await adminWs.getDnaDefinition(this.taskerDvm.cell.address.intoId());
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
      case 0: page = html`
          <div style="display: flex; gap:20px;">
              <tasker-page style="flex:1;"></tasker-page>
              <div style="display: flex; flex-direction: column; flex:1;">
                <h2 style="margin-bottom: 0px;">Agents</h2>
                <agent-directory-list></agent-directory-list>
                <passport-view style="padding-top:40px;"></passport-view>
              </div>                  
          </div>`;
      break;
      case 1: page = html`
          <div style="display: flex;">
            <membranes-dashboard style="flex: 1;"></membranes-dashboard>
              <membranes-creator-page style="flex: 1;"></membranes-creator-page>
          </div>`;
      break;
      case 2: page = html`
          <div style="display: flex;">
              <vouch-dashboard .knownAgents=${knownAgents} style="flex: 1;"></vouch-dashboard>
              <create-vouch-threshold style="flex: 1;"></create-vouch-threshold>
          </div>`;
      break;
      case 3: page = html`
          <div style="display: flex;">
            <create-entry-dashboard style="flex: 1;" .knownAgents=${knownAgents} .zomeIndexes="${this._dnaDef?.coordinator_zomes}" style="flex: 1;"></create-entry-dashboard>
            <create-cec-threshold style="flex: 1;" .zomeNames=${zomeNames} style="flex: 1;"></create-cec-threshold>
          </div>`;
      break;
      default: page = html`unknown page index`;
    }

    /* render all */
    return html`
        <cell-context .cell="${this._cell}">
          <div style=" display: flex; flex-direction: row; gap:5px;">
            <view-cell-context></view-cell-context>
            <span style=""> - <b>Agent:</b> ${this.taskerDvm.cell.address.agentId.short}</span>
          </div>
          <div style="display: flex; flex-direction: row">
            <div style="margin: 3px;">
              <input type="button" value="Tasker" @click=${() => {this._pageDisplayIndex = 0; this.requestUpdate()}} >
              <input type="button" value="Membranes" @click=${() => {this._pageDisplayIndex = 1; this.requestUpdate()}} >
              <input type="button" value="Vouch" @click=${() => {this._pageDisplayIndex = 2; this.requestUpdate()}} >
              <input type="button" value="CreateEntry" @click=${() => {this._pageDisplayIndex = 3; this.requestUpdate()}} >
            </div>
              <div style="flex:1;"></div>
            <div style="margin: 3px;">
              <input type="button" value="Make me king!" @click=${() => {this.cloneTasker()}}>
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
            <button type="button" @click=${async () => {
              this.taskerDvm.dumpCallLogs();
              this.taskerDvm.dumpSignalLogs();
              this.networkCaller?.dumpNetworkMetricsLogs();
          }}>dump</button>
            <button type="button" @click=${this.refresh}>Refresh</button>
          </div>
        </div>
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
