import {html} from "lit";
import {property, state, customElement} from "lit/decorators.js";
import {AgentId, ZomeElement} from "@ddd-qc/lit-happ";
import {VouchPerspective, VouchZvm} from "../viewModel/vouch.zvm";


/**
 * @element
 */
@customElement("vouch-dashboard")
export class VouchDashboard extends ZomeElement<VouchPerspective, VouchZvm> {

  /** */
  constructor() {
    super(VouchZvm.DEFAULT_ZOME_NAME)
  }


  /** -- Fields -- */

  @state() private _initialized = false;

  @property()
  knownAgents: AgentId[] = []


  /** -- Methods -- */

  /** After first render only */
  override async firstUpdated() {
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
    await this._zvm.vouchAgent(new AgentId(agentSelector.value), roleSelector.value)
  }


  /** */
  override render() {
    console.log("<vouch-dashboard> render()", this._initialized, this.perspective.roleNames);
    if (!this._initialized) {
      return html`<span>Loading...</span>`;
    }

    /* Agents */
    const agentOptions = this.knownAgents.map(
        (agentId) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value="${agentId.b64}">${agentId.short}</option>`
        }
    )
    /* Roles */
    const roleOptions = this.perspective.roleNames.map(
        (roleName) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value="${roleName}">${roleName}</option>`
        }
    )
    /* My Emitted Vouches */
    const myEmittedLi = Object.entries(this.perspective.myVouches).map(
        ([roleName, [emitted, _received]]) => {
          const emittedLi = emitted.map((vouch) => { return html`<li>${vouch.subject.b64}</li>`})
          return html `<li>${roleName}<ul>${emittedLi}</ul></li>`
        }
    )
    /* My Emitted Vouches */
    const myReceivedLi = Object.entries(this.perspective.myVouches).map(
        ([roleName, [_emitted, received]]) => {
          const lis = received.map(([_vouch, author]) => {
            return html`<li>${author.short}</li>`;
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
}
