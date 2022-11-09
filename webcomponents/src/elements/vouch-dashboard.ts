import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";
import { writable, Writable, derived, Readable, get, readable } from 'svelte/store';

//import {contextProvided} from "@holochain-open-dev/context";
import { contextProvided } from '@lit-labs/context';

//import {SlBadge, SlTooltip} from '@scoped-elements/shoelace';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {MembranesViewModel, membranesContext} from "../membranes.vm";
import {agentDirectoryContext, AgentDirectoryViewModel} from "../agent_directory.vm";
import {state} from "lit/decorators";
//import {IMAGE_SCALE} from "../constants";



/**
 * @element vouch-dashboard
 */
export class VouchDashboard extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** state */
  @state() initialized = false;

  /** Public attributes */
  @property({ type: Boolean, attribute: 'debug' })
  debugMode: boolean = false;

  /** Dependencies */
  @contextProvided({ context: membranesContext })
  _membranesViewModel!: MembranesViewModel;
  @contextProvided({ context: agentDirectoryContext })
  _agentDirectoryViewModel!: AgentDirectoryViewModel; // WARN is actually undefined at startup



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
    this._membranesViewModel.myVouchesStore.subscribe((_value) => {
      console.log("myVouchesStore update called");
      this.requestUpdate();
    });
    this._agentDirectoryViewModel.subscribe(this);
    await this.refresh();
    this.initialized = true;
    /** Done */
    console.log("vouch-dashboard.init() - DONE");
  }


  /** */
  async refresh(_e?: any) {
    console.log("refresh(): Pulling data from DHT")
    await this._membranesViewModel.pullAllFromDht();
    await this._membranesViewModel.pullMyClaims();
    await this._agentDirectoryViewModel.pullAllFromDht();
  }

  /** */
  async onVouch(e: any) {
    console.log("onVouch() CALLED", e)
    const agentSelector = this.shadowRoot!.getElementById("agentSelector") as HTMLSelectElement;
    const roleSelector = this.shadowRoot!.getElementById("roleSelector") as HTMLSelectElement;
    await this._membranesViewModel.vouchAgent(agentSelector.value, roleSelector.value)
    this.requestUpdate();
  }


  /** */
  render() {
    console.log("vouch-dashboard render() START");
    if (!this.initialized) {
      return html`<span>Loading...</span>`;
    }

    let myVouches = get(this._membranesViewModel.myVouchesStore);
    let agents = this._agentDirectoryViewModel.agents();

    /* Agents */
    const agentOptions = Object.values(agents).map(
        (agentIdB64) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value="${agentIdB64}">${agentIdB64.substring(0, 12)}</option>`
        }
    )
    /* Roles */
    const roleOptions = Object.entries(this._membranesViewModel.roleStore).map(
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
        <button type="button" @click=${this.refresh}>Refresh</button>        
        <span>${this._membranesViewModel.myAgentPubKey}</span>
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
