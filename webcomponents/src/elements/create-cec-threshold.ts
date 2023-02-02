import {css, html} from "lit";
import {state, property} from "lit/decorators.js";
import {ZomeElement} from "@ddd-qc/lit-happ";
import {CreateEntryCountPerspective, CreateEntryCountZvm} from "../viewModel/createEntryCount.zvm";
import {CreateEntryCountThreshold, MyAppEntryType} from "../bindings/createEntryCount.types";
import {CoordinatorZome} from "@holochain/client";


/**
 * @element vouch-dashboard
 */
export class CreateCecThreshold extends ZomeElement<CreateEntryCountPerspective, CreateEntryCountZvm> {

    /** */
    constructor() {
        super(CreateEntryCountZvm.DEFAULT_ZOME_NAME)
    }


    @state() private _initialized = false;

    @state() private _selectedZomeName = ""

    @property()
    allAppEntryTypes: Record<string, [string, boolean][]> = {};

    @property()
    zomeNames: string[] = [];

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
    describeThreshold(typed: CreateEntryCountThreshold): string {
        const zomeName = this.zomeNames[typed.entryType.zomeIndex];
        const zomeTypes = this.allAppEntryTypes[zomeName];
        console.log({zomeTypes})
        const entryType = zomeTypes[typed.entryType.entryIndex]
        return `Create ${typed.requiredCount} ${zomeName}::${entryType[0]} entries`;
    }


    /** */
    onCreateThreshold() {
        const zomeSelector = this.shadowRoot!.getElementById("selectedZome") as HTMLSelectElement;
        const entrySelector = this.shadowRoot!.getElementById("selectedEntryType") as HTMLSelectElement;
        const entryType: MyAppEntryType = {entryIndex: entrySelector.selectedIndex, zomeIndex: zomeSelector.selectedIndex, isPublic: true};  // FIXME
        const input = this.shadowRoot!.getElementById("createEntryCountNumber") as HTMLInputElement;
        const count = Number(input.value);
        const _res = this._zvm.createThreshold(entryType, count);
    }


    /** */
    onZomeSelect(e: any) {
        console.log("onZomeSelect() CALLED", e)
        const zomeSelector = this.shadowRoot!.getElementById("selectedZome") as HTMLSelectElement;
        this._selectedZomeName = zomeSelector.value;
    }


    /** */
    render() {
        console.log("<create-cec-threshold> render()", this._initialized);
        if (!this._initialized) {
            return html`<span>Loading...</span>`;
        }

        const thresholdsLi = Object.values(this.perspective.thresholds).map(
            (vt) => {
                return html `<ul>${this.describeThreshold(vt)}</ul>`
            });

        const zomeOptions = Object.keys(this.allAppEntryTypes).map(
            (zomeName) => {return html`<option>${zomeName}</option>`}
        )

        let zomeTypes = Object.entries(this.allAppEntryTypes)
            .filter((item) => {return item[0] == this._selectedZomeName;})
            .map((item) => {return item[1]});
        console.log({zomeTypes})
        let entryTypeOptions = null;
        if (zomeTypes.length > 0) {
            entryTypeOptions = Object.entries(zomeTypes[0]).map(
                ([_zomeName, pair]) => {
                    return html`
                                <option>${pair[0]}</option>`;
                });
        }

        /** render all */
        return html`
        <div>
          <h1>CreateEntryCount Threshold</h1>
          <h2>Existing</h2>
            <ul>
              ${thresholdsLi}
            </ul>            
          <h2>New CreateEntryCount Threshold</h2>
          <form>
              <label for="createEntryCountNumber">Create</label>
              <input type="number" id="createEntryCountNumber" style="width: 40px;">
              <select name="selectedZome" id="selectedZome" @click=${this.onZomeSelect}>
                  ${zomeOptions}
              </select>
              <span>::</span>
              <select name="selectedEntryType" id="selectedEntryType">
                  ${entryTypeOptions}
              </select>
              <span>entries.</span>
            <div>
              <input type="button" value="create" @click=${this.onCreateThreshold}>
            </div>
          </form>
        </div>
    `;
    }
}