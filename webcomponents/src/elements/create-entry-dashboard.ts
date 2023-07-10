import {css, html} from "lit";
import {property, state, customElement} from "lit/decorators.js";
import { ZomeElement } from "@ddd-qc/lit-happ";
import {AgentPubKeyB64, CoordinatorZome} from "@holochain/client";
import {MyAppEntryType} from "../bindings/createEntryCount.types";
import {CreateEntryCountZvm} from "../viewModel/createEntryCount.zvm";



/**
 * @element
 */
@customElement("create-entry-dashboard")
export class CreateEntryDashboard extends ZomeElement<void, CreateEntryCountZvm> {

  /** */
  constructor() {
    super(CreateEntryCountZvm.DEFAULT_ZOME_NAME)
  }

  /** -- Fields -- */
  @state() private _selectedZomeName = ""
  @state() private _queryResult = 0

  @property()
  knownAgents: AgentPubKeyB64[] = []
  @property()
  allAppEntryTypes: Record<string, [string, boolean][]> = {};


  @property()
  zomeIndexes: CoordinatorZome[] = [];


  getZomeIndex(zomeName: string): number {
    for (let i = 0; i < this.zomeIndexes.length; i += 1) {
      if (this.zomeIndexes[i][0] == zomeName) {
        return i;
      }
    }
    throw Error("Zome not found");
  }


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
    const zomeIndex = this.getZomeIndex(zomeSelector.value);
    const entryType: MyAppEntryType = {entryIndex: entrySelector.selectedIndex, zomeIndex, isPublic: true};  // FIXME
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
