import {css, html} from "lit";
import {property, state} from "lit/decorators.js";
import {AgentPubKeyB64} from "@holochain/client";

import { ZomeElement } from "@ddd-qc/lit-happ";
import {VouchPerspective, VouchZvm} from "../viewModel/vouch.zvm";


/**
 * @element vouch-dashboard
 */
export class VouchDashboard extends ZomeElement<VouchPerspective, VouchZvm> {

  /** */
  constructor() {
    super(VouchZvm.DEFAULT_ZOME_NAME)
  }


  /** -- Fields -- */

  @state() private _initialized = false;

  @property()
  knownAgents: AgentPubKeyB64[] = []


  /** -- Methods -- */

  /** After first render only */
  async firstUpdated() {
    await this.refresh();
    this._initialized = true;
  }


  /** */
  async refresh(_e?: any) {
    console.log("refresh(): Pulling data from DHT")
    await this._zvm.probeAll();
  }


  /** */
  async onVouch(e: any) {
    console.log("onVouch() CALLED", e)
    const agentSelector = this.shadowRoot!.getElementById("agentSelector") as HTMLSelectElement;
    const roleSelector = this.shadowRoot!.getElementById("roleSelector") as HTMLSelectElement;
    await this._zvm.vouchAgent(agentSelector.value, roleSelector.value)
  }


  /** */
  render() {
    console.log("<vouch-dashboard> render()", this._initialized, this.perspective.roleNames);
    if (!this._initialized) {
      return html`<span>Loading...</span>`;
    }

    /* Agents */
    const agentOptions = Object.values(this.knownAgents).map(
        (agentIdB64) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value="${agentIdB64}">${agentIdB64.substring(0, 12)}</option>`
        }
    )
    /* Roles */
    const roleOptions = Object.values(this.perspective.roleNames).map(
        (roleName) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value="${roleName}">${roleName}</option>`
        }
    )
    /* My Emitted Vouches */
    const myEmittedLi = Object.entries(this.perspective.myVouches).map(
        ([roleName, [emitted, received]]) => {
          const emittedLi = Object.values(emitted).map((vouch) => { return html`<li>${vouch.subject}</li>`})
          return html `<li>${roleName}<ul>${emittedLi}</ul></li>`
        }
    )
    /* My Emitted Vouches */
    const myReceivedLi = Object.entries(this.perspective.myVouches).map(
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
