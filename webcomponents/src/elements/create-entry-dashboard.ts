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
  isVouchThreshold, MyAppEntryType,
  VouchThreshold
} from "../membranes.types";
//import {IMAGE_SCALE} from "../constants";



/**
 * @element create-entry-dashboard
 */
export class CreateEntryDashboard extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property({ type: Boolean, attribute: 'debug' })
  debugMode: boolean = false;

  @property()
  agentStore: AgentPubKeyB64[] = []

  @property()
  appEntryTypeStore: Dictionary<[string, boolean][]> = {};

  /** Dependencies */
  @contextProvided({ context: membranesContext })
  _viewModel!: MembranesViewModel;


  private _selectedZomeName = ""
  private _queryResult = 0

  /** Private properties */
  _pullCount: number = 0


  /** Getters */

  /** After first render only */
  async firstUpdated() {
    console.log("create-entry-dashboard first update done!")
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
    console.log("create-entry-dashboard.init() - START!");
    /** Done */
    console.log("create-entry-dashboard.init() - DONE");
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
  async onZomeSelect(e: any) {
    console.log("onZomeSelect() CALLED", e)
    const zomeSelector = this.shadowRoot!.getElementById("selectedZome") as HTMLSelectElement;
    this._selectedZomeName = zomeSelector.value;
    this.requestUpdate();
  }


  /** */
  async onQuery(e: any) {
    console.log("onQuery() CALLED", e)
    const agentSelector = this.shadowRoot!.getElementById("agentSelector") as HTMLSelectElement;
    const zomeSelector = this.shadowRoot!.getElementById("selectedZome") as HTMLSelectElement;
    const entrySelector = this.shadowRoot!.getElementById("selectedEntryType") as HTMLSelectElement;
    const entryType: MyAppEntryType = {id: entrySelector.selectedIndex, zomeId: zomeSelector.selectedIndex, isPublic: true};  // FIXME
    this._queryResult = await this._viewModel.getCreateCount(agentSelector.value, entryType);
    this.requestUpdate();
  }


  /** */
  render() {
    console.log("create-entry-dashboard render() START");
    /* Agents */
    const agentOptions = Object.entries(this.agentStore).map(
        ([index, agentIdB64]) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value="${agentIdB64}">${agentIdB64.substring(0, 12)}</option>`
        }
    )
    const zomeOptions = Object.entries(this.appEntryTypeStore).map(
        ([zomeName, _entryDef]) => {
          return html`<option>${zomeName}</option>`
        }
    )
    let zomeTypes = Object.entries(this.appEntryTypeStore)
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
        <button type="button" @click=${this.refresh}>Refresh</button>        
        <span>${this._viewModel.myAgentPubKey}</span>
        <hr class="solid">
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
        <h3>Entries created:<span id="queryResultSpan">${this._queryResult}</span></h3>
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
