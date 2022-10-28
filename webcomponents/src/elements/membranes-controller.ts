import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";


//import {contextProvided} from "@holochain-open-dev/context";
import { contextProvided } from '@lit-labs/context';

//import {SlBadge, SlTooltip} from '@scoped-elements/shoelace';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ActionHashB64} from "@holochain-open-dev/core-types";
import {MembranesViewModel, membranesContext} from "../membranes.view_model";
import {EntryHash} from "@holochain/client";
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


  /** */
  async refresh(_e: any) {
    console.log("refresh(): Pulling data from DHT")
    await this._viewModel.pullAllFromDht();
    await this._viewModel.pullMyClaims();
    this._pullCount += 1;
    this.requestUpdate();
  }


  /** Render for real-time editing of frame */
  render() {
    console.log("membranes-admin-controller render() START");
    /* Roles */
    const rolesLi = Object.entries(this._viewModel.roleStore).map(
        ([ehB64, role]) => {
          //console.log("membrane:", ehB64)
          return html `<li title=${ehB64}><abbr>${role.name} - [${role.enteringMembranes.length}]</abbr></li>`
        }
    )
    /* Membranes */
    const membranesLi = Object.entries(this._viewModel.membraneStore).map(
        ([ehB64, membrane]) => {
          console.log("membrane:", membrane)
          return html `<li>${ehB64} - [${membrane.thresholds.length}]</li>`
        }
    )
    /* Thresholds */
    const thresholdsLi = Object.entries(this._viewModel.thresholdStore).map(
        ([ehB64, threshold]) => {
          //console.log("membrane:", ehB64)
          return html `<li title=${ehB64}>$<abbr>${JSON.stringify(threshold)}</abbr></li>`
        }
    )
    /* My Role Claims */
    const myRolesLi = Object.entries(this._viewModel.myRoleClaimsStore).map(
        ([ehB64, claim]) => {
          //console.log("membrane:", ehB64)
          return html `<li title=${ehB64}><abbr>${claim.role.name} - (crossed membrane index:${claim.membraneIndex})</abbr></li>`
        }
    )
    /* My Membrane Claims */
    const myMembranesLi = Object.entries(this._viewModel.myMembraneClaimsStore).map(
        ([ehB64, claim]) => {
          //console.log("membrane:", ehB64)
          return html `<li title="proof: ${JSON.stringify(claim.proof)}"><abbr>${ehB64}</abbr></li>`
        }
    )
    /** render all */
    return html`
      <div>
        <button type="button" @click=${this.refresh}>Refresh</button>        
        <span>${this._viewModel.myAgentPubKey}</span>
        <h1>Membrane Admin</h1>
        <h2>Roles</h2>
        <ul>${rolesLi}</ul>        
        <h2>Membranes</h2>
        <ul>${membranesLi}</ul>
        <h2>Thresholds</h2>
        <ul>${thresholdsLi}</ul>
        <hr class="solid">        
        <h2>My Passport</h2>
        <h3>Roles</h3>
        <ul>${myRolesLi}</ul>
        <h3>Membranes</h3>
        <ul>${myMembranesLi}</ul>
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
