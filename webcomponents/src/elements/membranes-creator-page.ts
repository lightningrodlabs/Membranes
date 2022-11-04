import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";


//import {contextProvided} from "@holochain-open-dev/context";
import { contextProvided } from '@lit-labs/context';

//import {SlBadge, SlTooltip} from '@scoped-elements/shoelace';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ActionHashB64, Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";
import {MembranesViewModel, membranesContext} from "../membranes.vm";
import {describe_threshold, MembraneThresholdKind, MyAppEntryType} from "../membranes.types";
//import {IMAGE_SCALE} from "../constants";



/**
 * @element membranes-dashboard
 */
export class MembranesCreatorPage extends ScopedElementsMixin(LitElement) {
    constructor() {
        super();
    }


    /** Public attributes */
    @property({ type: Boolean, attribute: 'debug' })
    debugMode: boolean = false;

    @property()
    appEntryTypeStore: Dictionary<[string, boolean][]> = {};

    /** Dependencies */
    @contextProvided({ context: membranesContext })
    _viewModel!: MembranesViewModel;


    /** Private properties */
    private _pullCount: number = 0

    private _membranesForRole: EntryHashB64[] = [];
    private _thresholdsForMembrane: EntryHashB64[] = [];
    private _kindForm = html``
    private _selectedZomeName = ""
    private _selectedKind = ""

    /** Getters */

    /** After first render only */
    async firstUpdated() {
        console.log("membranes-creator-page first update done!")
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
        console.log("membranes-creator-page.init() - START!");
        console.log({appEntryTypeStore: this.appEntryTypeStore})
        /** Done */
        console.log("membranes-creator-page.init() - DONE");
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
    async onCreateRole(e: any) {
        console.log("onCreateRole() CALLED", e)
        const input = this.shadowRoot!.getElementById("roleNameInput") as HTMLInputElement;
        let res = this._viewModel.createRole(input.value, this._membranesForRole);
        console.log("onCreateRole res:", res)
        input.value = "";
        this._membranesForRole = [];
        await this.refresh(null);
    }


    /** */
    async onAddMembrane(e: any) {
        console.log("onAddMembrane() CALLED", e)
        const membraneSelect = this.shadowRoot!.getElementById("membraneSelectedList") as HTMLSelectElement;
        const membraneEh = membraneSelect.value;
        console.log("membrane eh:", membraneEh);
        this._membranesForRole.push(membraneEh);
        this.requestUpdate();
    }



    /** */
    async onCreateMembrane(e: any) {
        console.log("onCreateMembrane() CALLED", e)
        let res = this._viewModel.createMembrane(this._thresholdsForMembrane);
        console.log("onCreateMembrane res:", res)
        this._thresholdsForMembrane = [];
        await this.refresh(null);
    }


    /** */
    async onAddThreshold(e: any) {
        console.log("onAddThreshold() CALLED", e)
        const thresholdSelect = this.shadowRoot!.getElementById("thresholdSelectedList") as HTMLSelectElement;
        const eh = thresholdSelect.value;
        console.log("thresholdSelect eh:", eh);
        this._thresholdsForMembrane.push(eh);
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
    async onKindSelect(e: any) {
        console.log("onKindSelect() CALLED", e);
        let kindName;
        if (!e.hasOwnProperty('originalTarget')) {
            const kindSelector = this.shadowRoot!.getElementById("kindList") as HTMLSelectElement;
            kindName = kindSelector.value;    
        } else { kindName = e.originalTarget.value }
        this._selectedKind = kindName
        switch(kindName) {
            case "CreateEntryCountThreshold": {
                const zomeOptions = Object.entries(this.appEntryTypeStore).map(
                    ([zomeName, _entryDef]) => {
                        return html`
                            <option>${zomeName}</option>`
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
                            return html`
                                <option>${pair[0]}</option>`;
                        });
                }
                console.log({entryTypeOptions})
                this._kindForm = html`
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
                `;
                break;
            }
            case "VouchThreshold":  {
                this._kindForm = html`
                    <label for="requiredVouchCount">Receive</label>
                    <input type="number" id="requiredVouchCount" style="width: 40px;">
                    <input type="text" id="forRoleInput" style="width: 80px;">
                    <label for="byRoleInput">vouch(es) by a</label>
                    <input type="text" id="byRoleInput" style="width: 80px;">
                `;
                break;
            }
            default: this._kindForm = html ``
        }
        /* Done */
        this.requestUpdate();
    }


    /** */
    async onCreateThreshold(e: any) {
        console.log("onCreateThreshold() CALLED", e);
        switch (this._selectedKind) {
            case "CreateEntryCountThreshold": {
                const zomeSelector = this.shadowRoot!.getElementById("selectedZome") as HTMLSelectElement;
                const entrySelector = this.shadowRoot!.getElementById("selectedEntryType") as HTMLSelectElement;
                const entryType: MyAppEntryType = {id: entrySelector.selectedIndex, zomeId: zomeSelector.selectedIndex, isPublic: true};  // FIXME
                const input = this.shadowRoot!.getElementById("createEntryCountNumber") as HTMLInputElement;
                const count = Number(input.value);
                const res = this._viewModel.createCreateEntryCountThreshold(entryType, count);
                break;
            }
            case "VouchThreshold": {
                const input = this.shadowRoot!.getElementById("requiredVouchCount") as HTMLInputElement;
                const count = Number(input.value);
                const input2 = this.shadowRoot!.getElementById("forRoleInput") as HTMLInputElement;
                const forRole = input2.value;
                const input3 = this.shadowRoot!.getElementById("byRoleInput") as HTMLInputElement;
                const byRole = input3.value;
                let res = this._viewModel.createVouchThreshold(count, byRole, forRole);
                break;
            }
            default:
                break;
        }
        this._kindForm = html``;
        this._selectedZomeName = "";
        await this.refresh(null);
    }


    /** */
    render() {
        console.log("membranes-creator-page render() START");

        const allZomeTypes: [string, boolean][][] = Object.entries(this.appEntryTypeStore)
            .map(([_name, types]) => {return types;})

        const membranesForRoleLi = Object.entries(this._membranesForRole).map(
            ([_index, ehB64]) => {
                return html `<li>${ehB64}</li>`
            }
        )
        const membraneOptions = Object.entries(this._viewModel.membraneStore).map(
            ([ehB64, _membrane]) => {
                return html `<option value="${ehB64}">${ehB64.substring(0, 12)}</option>`
            }
        )

        const thresholdsLi = Object.entries(this._thresholdsForMembrane).map(
            ([_index, ehB64]) => {
                return html `<li>${describe_threshold(this._viewModel.thresholdStore[ehB64], allZomeTypes)}</li>`
            }
        )

        const thresholdOptions = Object.entries(this._viewModel.thresholdStore).map(
            ([ehB64, th]) => {
                return html `<option value="${ehB64}">${describe_threshold(th, allZomeTypes)}</option>`
            }
        )

        const kindOptions = Object.keys(MembraneThresholdKind)
            .filter((item) => {return isNaN(Number(item));})
            .map((kind) => {
                return html `<option value="${kind}">${kind}</option>`
            });

        /** render all */
        return html`
        <div>
            <button type="button" @click=${this.refresh}>Refresh</button>        
            <span>${this._viewModel.myAgentPubKey}</span>
            <hr class="solid">
            <h1>Membrane Creator</h1>
            <!-- NEW ROLE -->
            <h2>New Role</h2>
              <form>
                  <label for="roleNameInput">Name:</label>
                  <input type="text" id="roleNameInput" name="name">
                  <br/><br/>
                  Entering Membranes:
                  <ul id="membranesForRoleList">${membranesForRoleLi}</ul>
                  <select name="membraneSelectedList" id="membraneSelectedList">
                      ${membraneOptions}
                  </select>
                  <input type="button" value="Add" @click=${this.onAddMembrane}>
                  <div>
                      <input type="button" value="create" @click=${this.onCreateRole}>                      
                  </div>
              </form>
            <hr class="solid">
            <!-- NEW Membrane -->
            <h2>New Membrane</h2>
            <form>
                <ul id="thresholdsList">${thresholdsLi}</ul>
                <select name="thresholdSelectedList" id="thresholdSelectedList">
                    ${thresholdOptions}
                </select>
                <input type="button" value="Add" @click=${this.onAddThreshold}>
                <div>
                    <input type="button" value="create" @click=${this.onCreateMembrane}>
                </div>
            </form>            
            <!-- NEW Threshold -->
            <hr class="solid">
            <h2>
                New Threshold:
                <select name="kindList" id="kindList" @click=${this.onKindSelect}>
                    ${kindOptions}
                </select>
            </h2>
            <form>
                <div style="padding:15px;">
                    ${this._kindForm}
                </div>                    
                <div>
                    <input type="button" value="create" @click=${this.onCreateThreshold}>
                </div>
            </form>
            <!-- NEW Privilege -->
            <hr class="solid">
            <h2>New Privilege</h2>
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