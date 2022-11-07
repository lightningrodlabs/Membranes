import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";

import { contextProvided } from '@lit-labs/context';

import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {agentDirectoryContext, AgentDirectoryViewModel} from "../agent_directory.vm";



/**
 * @element agent-directory-dashboard
 */
export class AgentDirectoryDashboard extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property({ type: Boolean, attribute: 'debug' })
  debugMode: boolean = false;

  // @property()
  // agentStore: AgentPubKeyB64[] = []
  //
  // @property()
  // appEntryTypeStore: Dictionary<[string, boolean][]> = {};

  /** Dependencies */
  @contextProvided({ context: agentDirectoryContext })
  _viewModel!: AgentDirectoryViewModel;


  /** After first render only */
  async firstUpdated() {
    // n/a
  }


  /** After each render */
  async updated(changedProperties: any) {
    // n/a
  }


  /** */
  async refresh(_e: any) {
    console.log("refresh(): Pulling data from DHT")
    await this._viewModel.pullAllRegisteredAgents();
    this.requestUpdate();
  }


  /** */
  render() {
    console.log("agent-directory-dashboard render() START");
    /* Agents */
    const agentOptions = Object.entries(this._viewModel.agentStore).map(
        ([_index, agentIdB64]) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<li value="${agentIdB64}">${agentIdB64}</li>`
        }
    )

    /** render all */
    return html`
      <div>
        <button type="button" @click=${this.refresh}>Refresh</button>        
        <span>${this._viewModel.myAgentPubKey}</span>
        <hr class="solid">
        <h1>Agent Directory Dashboard</h1>
        <ul>
          ${agentOptions}
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
