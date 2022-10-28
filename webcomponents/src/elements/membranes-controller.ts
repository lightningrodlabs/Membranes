import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";


//import {contextProvided} from "@holochain-open-dev/context";
import { contextProvided } from '@lit-labs/context';

//import {SlBadge, SlTooltip} from '@scoped-elements/shoelace';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ActionHashB64} from "@holochain-open-dev/core-types";
import {MembranesViewModel, membranesContext} from "../membranes.view_model";
//import {IMAGE_SCALE} from "../constants";


const delay = (ms:number) => new Promise(r => setTimeout(r, ms))

const toHHMMSS = function (str: string) {
  var sec_num = parseInt(str, 10); // don't forget the second param
  var hours:any   = Math.floor(sec_num / 3600);
  var minutes:any = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds:any = sec_num - (hours * 3600) - (minutes * 60);

  if (hours   < 10) {hours   = "0"+hours;}
  if (minutes < 10) {minutes = "0"+minutes;}
  if (seconds < 10) {seconds = "0"+seconds;}
  return hours+':'+minutes+':'+seconds;
}


/**
 * @element membranes-admin-controller
 */
export class MembranesAdminController extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property({ type: Boolean, attribute: 'debug' })
  debugMode: boolean = false;

  /** Dependencies */
  @contextProvided({ context: membranesContext })
  _viewModel!: MembranesViewModel;


  /** Private properties */
  _pullCount: number = 0

  /** Getters */


  // get datePickerElem(): any {
  //   return this.shadowRoot!.getElementById("my-date-picker");
  // }
  //
  // get loadingOverlayElem(): HTMLDivElement {
  //   return this.shadowRoot!.getElementById("loading-overlay") as HTMLDivElement;
  // }


  /** After first render only */
  async firstUpdated() {
    console.log("membranes-admin-controller first update done!")
    await this.init();
  }


  /** After each render */
  async updated(changedProperties: any) {
    //console.log("*** updated() called !")
  }


  /**
   * Called after first update
   * Get local snapshots and latest from DHT
   */
  private async init() {
    console.log("membranes-admin-controller.init() - START!");
    /** Done */
    console.log("membranes-admin-controller.init() - DONE");
  }



  /** Called once after init is done and canvas has been rendered */
  private async postInit() {
    console.log("membranes-admin-controller.postInit() - START!");
    // FIXME
    console.log("membranes-admin-controller.postInit() - DONE");
  }


  /** */
  async refresh(_e: any) {
    console.log("refresh(): Pulling data from DHT")
    await this._viewModel.pullAllFromDht()
    this._pullCount += 1;
    this.requestUpdate();
  }


  /** */
  async onListSelect(e: any) {
    //console.log("onListSelect() CALLED", e)
    //console.log("onListSelect() list:", e.originalTarget.value)
  }


  /** Render for real-time editing of frame */
  render() {
    console.log("membranes-admin-controller render() START");


    /** render all */
    return html`
      <div>
        <button type="button" @click=${this.refresh}>Refresh</button>        
        <span>${this._viewModel.myAgentPubKey}</span>
        <h1>Membrane Admin</h1>
      </div>
    `;
  }


  /** */
  static get scopedElements() {
    return {
      //"place-snapshot": PlaceSnapshot,
      //'sl-tooltip': SlTooltip,
      //'sl-badge': SlBadge,
    };
  }


  static get styles() {
    return [
      css``,
    ];
  }
}
