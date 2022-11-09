import {css, html, LitElement} from "lit";
import {property, state} from "lit/decorators.js";
import { writable, Writable, derived, Readable, get, readable } from 'svelte/store';
import { contextProvided } from '@lit-labs/context';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";

import {AgentPubKeyB64} from "@holochain-open-dev/core-types";

import {MembranesViewModel, membranesContext} from "../membranes.vm";



/**
 * @element vouch-dashboard
 */
export class VouchDashboard extends ScopedElementsMixin(LitElement) {

  /** -- Fields -- */
  @state() initialized = false;

  @contextProvided({ context: membranesContext })
  _membranesViewModel!: MembranesViewModel;

  @property()
  knownAgents: AgentPubKeyB64[] = []


  /** After first render only */
  async firstUpdated() {
    console.log("vouch-dashboard first update done!")
    await this.init();
  }


  /**
   * Called after first update
   * Get local snapshots and latest from DHT
   */
  private async init() {
    console.log("vouch-dashboard.init() - START!");
    this._membranesViewModel.myVouchesStore.subscribe((_value) => {
      console.log("myVouchesStore update called");
      this.requestUpdate();
    });
    this._membranesViewModel.roleStore.subscribe((_value) => {
      this.requestUpdate();
    });
    await this.refresh();
    this.initialized = true;
    /** Done */
    console.log("vouch-dashboard.init() - DONE");
  }


  /** After each render */
  async updated(changedProperties: any) {
    //console.log("*** updated() called !")
  }


  /** */
  async refresh(_e?: any) {
    console.log("refresh(): Pulling data from DHT")
    await this._membranesViewModel.pullAllFromDht();
  }

  /** */
  async onVouch(e: any) {
    console.log("onVouch() CALLED", e)
    const agentSelector = this.shadowRoot!.getElementById("agentSelector") as HTMLSelectElement;
    const roleSelector = this.shadowRoot!.getElementById("roleSelector") as HTMLSelectElement;
    await this._membranesViewModel.vouchAgent(agentSelector.value, roleSelector.value)
  }


  /** */
  render() {
    console.log("vouch-dashboard render() START");
    if (!this.initialized) {
      return html`<span>Loading...</span>`;
    }

    /* Grab data */
    let myVouches = get(this._membranesViewModel.myVouchesStore);
    let roles = get(this._membranesViewModel.roleStore);

    /* Agents */
    const agentOptions = Object.values(this.knownAgents).map(
        (agentIdB64) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value="${agentIdB64}">${agentIdB64.substring(0, 12)}</option>`
        }
    )
    /* Roles */
    const roleOptions = Object.entries(roles).map(
        ([index, role]) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value="${role.name}">${role.name}</option>`
        }
    )
    /* My Emitted Vouches */
    const myEmittedLi = Object.entries(myVouches).map(
        ([roleName, [emitted, received]]) => {
          const emittedLi = Object.values(emitted).map((vouch) => { return html`<li>${vouch.subject}</li>`})
          return html `<li>${roleName}<ul>${emittedLi}</ul></li>`
        }
    )
    /* My Emitted Vouches */
    const myReceivedLi = Object.entries(myVouches).map(
        ([roleName, [emitted, received]]) => {
          const lis = Object.values(received).map(([vouch, author]) => {
            return html`<li>${author}</li>`;
          })
          return html `<li>${roleName}<ul>${lis}</ul></li>`
        }
    )

    /** render all */
    return html`
      <div>
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
      //'sl-tooltip': SlTooltip,
    };
  }


  static get styles() {
    return [
      css``,
    ];
  }
}
