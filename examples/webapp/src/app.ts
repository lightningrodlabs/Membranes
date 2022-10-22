import { LitElement, html } from "lit";
import { state } from "lit/decorators.js";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {CellId} from "@holochain/client";
import {HolochainClient} from "@holochain-open-dev/cell-client";
import {ContextProvider} from "@lit-labs/context";
import {serializeHash} from '@holochain-open-dev/utils';

import {AppWebsocket} from "@holochain/client";

import {TaskerController} from "./elements/controller";
import {HolochainStore} from "./holochain.store";
import {taskerContext} from "./types";

let APP_ID = 'tasker'
let HC_PORT:any = process.env.HC_PORT;
let NETWORK_ID: any = null

console.log("HC_PORT = " + HC_PORT + " || " + process.env.HC_PORT);


/** */
export class TaskerApp extends ScopedElementsMixin(LitElement) {

  @state() loaded = false;

  _taskerStore: HolochainStore | null = null;

  _taskerCellId: CellId | null = null;


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
    this._taskerStore = new HolochainStore(hcClient, this._taskerCellId);
    new ContextProvider(this, taskerContext, this._taskerStore);
    /** Done */
    this.loaded = true;
  }


  render() {
    console.log("tasker-app render() called!")
    if (!this.loaded) {
      return html`<span>Loading...</span>`;
    }
    return html`
       <tasker-controller style="flex: 1;"></tasker-controller>
    `;
  }


  static get scopedElements() {
    return {
      "tasker-controller": TaskerController,
    };
  }
}
