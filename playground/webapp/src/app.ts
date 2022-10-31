import { LitElement, html } from "lit";
import { state } from "lit/decorators.js";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {CellId} from "@holochain/client";
import {HolochainClient} from "@holochain-open-dev/cell-client";
import {ContextProvider} from "@lit-labs/context";

import {AppWebsocket} from "@holochain/client";

import {TaskerPage} from "./elements/tasker-page";
import {TaskerViewModel, taskerContext} from "./tasker.vm";
import {MembranesDashboard, MembranesViewModel, membranesContext, MembranesCreatorPage} from "@membranes/elements";

let APP_ID = 'tasker'
let HC_PORT:any = process.env.HC_PORT;
let NETWORK_ID: any = null

console.log("HC_PORT = " + HC_PORT + " || " + process.env.HC_PORT);


/** */
export class TaskerApp extends ScopedElementsMixin(LitElement) {

  @state() loaded = false;

  private _taskerViewModel: TaskerViewModel | null = null;
  private _membranesViewModel: MembranesViewModel | null = null;

  private _taskerCellId: CellId | null = null;

  private _pageDisplayIndex: number = 0;


  /** */
  async firstUpdated() {
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
    this._taskerCellId  = appInfo.cell_data[0].cell_id;
    this._taskerViewModel = new TaskerViewModel(hcClient, this._taskerCellId);
    new ContextProvider(this, taskerContext, this._taskerViewModel);
    this._membranesViewModel = new MembranesViewModel(hcClient, this._taskerCellId);
    new ContextProvider(this, membranesContext, this._membranesViewModel);
    /** Done */
    this.loaded = true;
  }


  render() {
    console.log("tasker-app render() called!")
    if (!this.loaded) {
      return html`<span>Loading...</span>`;
    }

    let page;
    switch (this._pageDisplayIndex) {
      case 0: page = html`<tasker-page style="flex: 1;"></tasker-page>` ; break;
      case 1: page = html`<membranes-dashboard style="flex: 1;"></membranes-dashboard>`; break;
      case 2: page = html`<membranes-creator-page style="flex: 1;"></membranes-creator-page>`; break;
      default: page = html`unknown page index`;
    };

    return html`
      <div>
        <input type="button" value="Tasker" @click=${() => {this._pageDisplayIndex = 0; this.requestUpdate()}} >
        <input type="button" value="Membranes Dashboard" @click=${() => {this._pageDisplayIndex = 1; this.requestUpdate()}} >
        <input type="button" value="Membranes Creator" @click=${() => {this._pageDisplayIndex = 2; this.requestUpdate()}} >
      </div>
      ${page}
    `
  }


  static get scopedElements() {
    return {
      "tasker-page": TaskerPage,
      "membranes-dashboard": MembranesDashboard,
      "membranes-creator-page": MembranesCreatorPage,
    };
  }
}
