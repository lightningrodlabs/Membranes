import {html} from "lit";
import {property, state, customElement} from "lit/decorators.js";
import {AgentId, ZomeElement} from "@ddd-qc/lit-happ";
import {CoordinatorZome} from "@holochain/client";
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
  knownAgents: AgentId[] = []

  @property()
  zomeIndexes: CoordinatorZome[] = [];


  getZomeIndex(zomeName: string): number {
    for (let i = 0; i < this.zomeIndexes.length; i += 1) {
      if (this.zomeIndexes[i]![0] == zomeName) {
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
    this._queryResult = await this._zvm.getCreateCount(new AgentId(agentSelector.value), entryType);
  }


  /** */
  override render() {
    console.log("<create-entry-dashboard> render()");

    /* Agents */
    const agentOptions = Object.entries(this.knownAgents).map(
        ([_index, agentId]) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value="${agentId.b64}">${agentId.short}</option>`
        }
    )
    const zomeOptions = Object.entries(this._zvm.allEntryDefs).map(
        ([zomeName, _entryDef]) => {
          return html`<option>${zomeName}</option>`
        }
    )
    let zomeTypesList = Object.entries(this._zvm.allEntryDefs)
        .filter((item) => {return item[0] == this._selectedZomeName;})
        .map((item) => {return item[1]});
    console.log({zomeTypesList})

    let entryTypeOptions = null;
    if (zomeTypesList.length > 0) {
        let zomeTypes = zomeTypesList[0]!;
      entryTypeOptions = Object.values(zomeTypes).map(
          (entryDef) => {
              if ("App" in entryDef.id) {
                  return html`<option>${entryDef.id.App}</option>`;
              } else {
                  return html`<option>(Cap)</option>`;
              }
          });
    }
    console.log({entryTypeOptions})

    /** render all */
    return html`
      <div>
        <h1>CreateEntry</h1>
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
