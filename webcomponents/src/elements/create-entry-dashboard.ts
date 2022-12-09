import {css, html} from "lit";
import {property, state} from "lit/decorators.js";
import {AgentPubKeyB64, Dictionary} from "@holochain-open-dev/core-types";
import {MembranesZvm} from "../membranes.zvm";
import {MyAppEntryType} from "../membranes.bindings";
import { ZomeElement } from "@ddd-qc/lit-happ";
import { MembranesPerspective } from "../membranes.perspective";



/**
 * @element create-entry-dashboard
 */
export class CreateEntryDashboard extends ZomeElement<MembranesPerspective, MembranesZvm> {

  /** */
  constructor() {
    super(MembranesZvm.DEFAULT_ZOME_NAME)
  }

  /** -- Fields -- */
  @state() private _selectedZomeName = ""
  @state() private _queryResult = 0

  @property()
  knownAgents: AgentPubKeyB64[] = []
  @property()
  allAppEntryTypes: Dictionary<[string, boolean][]> = {};




  /** */
  async onZomeSelect(e: any) {
    console.log("onZomeSelect() CALLED", e)
    const zomeSelector = this.shadowRoot!.getElementById("selectedZome") as HTMLSelectElement;
    this._selectedZomeName = zomeSelector.value;
  }


  /** */
  async onQuery(e: any) {
    console.log("onQuery() CALLED", e)
    const agentSelector = this.shadowRoot!.getElementById("agentSelector") as HTMLSelectElement;
    const zomeSelector = this.shadowRoot!.getElementById("selectedZome") as HTMLSelectElement;
    const entrySelector = this.shadowRoot!.getElementById("selectedEntryType") as HTMLSelectElement;
    const entryType: MyAppEntryType = {id: entrySelector.selectedIndex, zomeId: zomeSelector.selectedIndex, isPublic: true};  // FIXME
    this._queryResult = await this._zvm.getCreateCount(agentSelector.value, entryType);
  }


  /** */
  render() {
    console.log("<create-entry-dashboard> render()");

    /* Agents */
    const agentOptions = Object.entries(this.knownAgents).map(
        ([index, agentIdB64]) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value="${agentIdB64}">${agentIdB64.substring(0, 12)}</option>`
        }
    )
    const zomeOptions = Object.entries(this.allAppEntryTypes).map(
        ([zomeName, _entryDef]) => {
          return html`<option>${zomeName}</option>`
        }
    )
    let zomeTypes = Object.entries(this.allAppEntryTypes)
        .filter((item) => {return item[0] == this._selectedZomeName;})
        .map((item) => {return item[1]});
    console.log({zomeTypes})

    let entryTypeOptions = null;
    if (zomeTypes.length > 0) {
      entryTypeOptions = Object.entries(zomeTypes[0]).map(
          ([_zomeName, pair]) => {
            return html`<option>${pair[0]}</option>`;
          });
    }
    console.log({entryTypeOptions})

    /** render all */
    return html`
      <div>
        <h1>CreateEntry Dashboard</h1>
        <span>Agent</span>
        <select id="agentSelector">
          ${agentOptions}
        </select>
        <span>for entry</span>
        <select name="selectedZome" id="selectedZome" @click=${this.onZomeSelect}>
          ${zomeOptions}
        </select>
        <span>::</span>
        <select name="selectedEntryType" id="selectedEntryType">
          ${entryTypeOptions}
        </select>     
        <input type="button" value="Query" @click=${this.onQuery}>
        <h3>Entries created:<span id="queryResultSpan">&nbsp;${this._queryResult}</span></h3>
      </div>
    `;
  }

}
