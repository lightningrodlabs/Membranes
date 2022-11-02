import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";


//import {contextProvided} from "@holochain-open-dev/context";
import { contextProvided } from '@lit-labs/context';

//import {SlBadge, SlTooltip} from '@scoped-elements/shoelace';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ActionHashB64, Dictionary} from "@holochain-open-dev/core-types";
import {MembranesViewModel, membranesContext} from "../membranes.vm";
import {EntryHash} from "@holochain/client";
import {
  CreateEntryCountThreshold,
  describe_threshold,
  isCreateThreshold,
  isVouchThreshold,
  VouchThreshold
} from "../membranes.types";
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
 * @element membranes-dashboard
 */
export class MembranesDashboard extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property({ type: Boolean, attribute: 'debug' })
  debugMode: boolean = false;

  @property()
  appEntryTypeStore: Dictionary<[string, boolean][]> = {};

  /** Dependencies */
  @contextProvided({ context: membranesContext })
  _viewModel!: MembranesViewModel;


  /** Private properties */
  _pullCount: number = 0


  /** Getters */

  /** After first render only */
  async firstUpdated() {
    console.log("membranes-dashboard first update done!")
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
    console.log("membranes-dashboard.init() - START!");
    /** Done */
    console.log("membranes-dashboard.init() - DONE");
  }


  /** */
  async refresh(_e: any) {
    console.log("refresh(): Pulling data from DHT")
    await this._viewModel.pullAllFromDht();
    await this._viewModel.pullMyClaims();
    this._pullCount += 1;
    this.requestUpdate();
  }


  /** */
  render() {
    console.log("membranes-dashboard render() START");
    const allZomeTypes: [string, boolean][][] = Object.entries(this.appEntryTypeStore)
        .map(([_name, types]) => {return types;})
    /* Roles */
    const rolesLi = Object.entries(this._viewModel.roleStore).map(
        ([ehB64, role]) => {
            console.log("Role", role)
          const MembraneLi = Object.entries(role.enteringMembranes).map(
              ([_index, membrane]) => {
                return html `<li>${this._viewModel.findMembrane(membrane)}</li>`
              }
          )
            console.log("MembraneLi", MembraneLi)
          return html `<li style="margin-top:10px;" title=${ehB64}>
            <abbr><b>${role.name}</b></abbr>
              <br/>
              &nbsp;&nbsp;&nbsp;Membranes:
            <ul>
              ${MembraneLi}
            </ul>
          </li>`
        }
    )
    /* Membranes */
    const membranesLi = Object.entries(this._viewModel.membraneStore).map(
        ([ehB64, membrane]) => {
          console.log("membrane:", membrane)
          const thresholdLi = Object.entries(membrane.thresholds).map(
              ([_index, th]) => {
                return html `<li>${describe_threshold(th, allZomeTypes)}</li>`
              }
          )
          return html `
          <li style="margin-top:10px;">
              <b>${ehB64}</b>
              <br/>
              &nbsp;&nbsp;&nbsp;Thresholds:
            <ul>
              ${thresholdLi}
            </ul>
          </li>`
        }
    )
    /* Thresholds */
    const thresholdsLi = Object.entries(this._viewModel.thresholdStore).map(
        ([ehB64, threshold]) => {
          console.log({threshold})
          let desc = describe_threshold(threshold, allZomeTypes);
          return html `<li title=${ehB64}><abbr>${desc}</abbr></li>`
        }
    )
    /* My Role Claims */
    const myRoleClaimsLi = Object.entries(this._viewModel.myRoleClaimsStore).map(
        ([ehB64, claim]) => {
          //console.log("membrane:", ehB64)
          return html `<li title=${ehB64}><abbr>${claim.role.name} - (crossed membrane index:${claim.membraneIndex})</abbr></li>`
        }
    )
    /* My Membrane Claims */
    const myMembraneClaimsLi = Object.entries(this._viewModel.myMembraneClaimsStore).map(
        ([ehB64, claim]) => {
          console.log("membrane claim:", ehB64, claim)
          return html `<li title="proofs: ${JSON.stringify(claim.proofs)}"><abbr>${this._viewModel.findMembrane(claim.membrane)}</abbr></li>`
        }
    )
    /** render all */
    return html`
      <div>
        <button type="button" @click=${this.refresh}>Refresh</button>        
        <span>${this._viewModel.myAgentPubKey}</span>
        <hr class="solid">
        <h1>Membranes Dashboard</h1>
        <h2>Roles</h2>
        <ul>${rolesLi}</ul>        
        <h2>Membranes</h2>
        <ul>${membranesLi}</ul>
        <h2 style="margin-top:30px;margin-bottom:0px;">Thresholds</h2>
        <ul>${thresholdsLi}</ul>
        <hr class="solid">        
        <h2>My Passport <button type="button" @click=${this.claimAll}>Claim all</button></h2>
        <h3>Roles</h3>
        <ul>${myRoleClaimsLi}</ul>
        <h3>Membranes</h3>
        <ul>${myMembraneClaimsLi}</ul>
      </div>
    `;
  }

    async claimAll(e:any) {
      await this._viewModel.claimAll();
      await this.refresh(undefined)
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
