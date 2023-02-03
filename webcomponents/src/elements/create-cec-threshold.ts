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
        return `Create ${typed.requiredCount} entries of type "${zomeName}::${entryType[0]}"`;
    }


    getZomeIndex(zomeName: string): number {
        for (let i = 0; i < this.zomeNames.length; i += 1) {
            if (this.zomeNames[i] == zomeName) {
                return i;
            }
        }
        throw Error("Zome not found");
    }


    /** */
    onCreateThreshold() {
        const zomeSelector = this.shadowRoot!.getElementById("selectedZome") as HTMLSelectElement;
        const entrySelector = this.shadowRoot!.getElementById("selectedEntryType") as HTMLSelectElement;
        const zomeIndex = this.getZomeIndex(zomeSelector.value);
        const entryType: MyAppEntryType = {entryIndex: entrySelector.selectedIndex, zomeIndex, isPublic: true};
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
                return html `<li>${this.describeThreshold(vt)}</li>`
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
            entryTypeOptions = Object.values(zomeTypes[0]).map(
                ([entryName, _isPublic]) => {
                    return html`<option>${entryName}</option>`;
                });
        }

        /** render all */
        return html`
        <div>
          <h1>CreateEntryCount Threshold</h1>
          <h2>Existing thresholds</h2>
            <ul>
              ${thresholdsLi}
            </ul>            
          <h2>New threshold</h2>
          <form>
              <label for="createEntryCountNumber">Create</label>
              <input type="number" id="createEntryCountNumber" style="width: 40px;">
              <span>entries of type </span>              
              <select name="selectedZome" id="selectedZome" @click=${this.onZomeSelect}>
                  ${zomeOptions}
              </select>
              <span>::</span>
              <select name="selectedEntryType" id="selectedEntryType">
                  ${entryTypeOptions}
              </select>
            <div style="margin-top:10px;">
              <input type="button" value="create" @click=${this.onCreateThreshold}>
            </div>
          </form>
        </div>
    `;
    }
}