import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";


//import {contextProvided} from "@holochain-open-dev/context";
import { contextProvided } from '@lit-labs/context';

//import {SlBadge, SlTooltip} from '@scoped-elements/shoelace';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ActionHashB64, AgentPubKeyB64, Dictionary} from "@holochain-open-dev/core-types";
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



/**
 * @element vouch-dashboard
 */
export class VouchDashboard extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property({ type: Boolean, attribute: 'debug' })
  debugMode: boolean = false;

  @property()
  agentStore: AgentPubKeyB64[] = []

  /** Dependencies */
  @contextProvided({ context: membranesContext })
  _viewModel!: MembranesViewModel;


  /** Private properties */
  _pullCount: number = 0


  /** Getters */

  /** After first render only */
  async firstUpdated() {
    console.log("vouch-dashboard first update done!")
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
    console.log("vouch-dashboard.init() - START!");
    /** Done */
    console.log("vouch-dashboard.init() - DONE");
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
  async onVouch(e: any) {
    console.log("onVouch() CALLED", e)
    const agentSelector = this.shadowRoot!.getElementById("agentSelector") as HTMLSelectElement;
    const roleSelector = this.shadowRoot!.getElementById("roleSelector") as HTMLSelectElement;
    await this._viewModel.vouchAgent(agentSelector.value, roleSelector.value)
    this.requestUpdate();
  }


  /** */
  render() {
    console.log("vouch-dashboard render() START");
    /* Agents */
    const agentOptions = Object.entries(this.agentStore).map(
        ([index, agentIdB64]) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value="${agentIdB64}">${agentIdB64.substring(0, 12)}</option>`
        }
    )
    /* Roles */
    const roleOptions = Object.entries(this._viewModel.roleStore).map(
        ([index, role]) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value="${role.name}">${role.name}</option>`
        }
    )
    /* My Emitted Vouches */
    const myEmittedLi = Object.entries(this._viewModel.myVouchesStore).map(
        ([roleName, [emitted, received]]) => {
          const emittedLi = Object.values(emitted).map((vouch) => { return html`<li>${vouch.subject}</li>`})
          return html `<li>${roleName}<ul>${emittedLi}</ul></li>`
        }
    )
    /* My Emitted Vouches */
    const myReceivedLi = Object.entries(this._viewModel.myVouchesStore).map(
        ([roleName, [emitted, received]]) => {
          const lis = Object.values(received).map((vouch) => { return html`<li>${vouch.subject}</li>`})
          return html `<li>${roleName}<ul>${lis}</ul></li>`
        }
    )
    /** render all */
    return html`
      <div>
        <button type="button" @click=${this.refresh}>Refresh</button>        
        <span>${this._viewModel.myAgentPubKey}</span>
        <hr class="solid">
        <h1>Vouch Dashboard</h1>
        <span>Vouch</span>
        <select id="agentSelector">
          ${agentOptions}
        </select>
        <span>for Role</span>
        <select id="roleSelector">
          ${roleOptions}
        </select>        
        <input type="button" value="Submit" @click=${this.onVouch}>
        <hr class="solid">        
        <h2>Vouches Emitted</h2>
        <ul>
          ${myEmittedLi}
        </ul>
        <hr class="solid">
        <h2>Received Vouches</h2>
        <ul>
          ${myReceivedLi}
        </ul>
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
