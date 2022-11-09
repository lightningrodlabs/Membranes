import {css, html, LitElement} from "lit";
import {property, state} from "lit/decorators.js";
import { writable, Writable, derived, Readable, get, readable } from 'svelte/store';
import {contextProvided} from '@lit-labs/context';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";

import {ActionHashB64, Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";

import {MembranesViewModel, membranesContext} from "../membranes.vm";
import {describe_threshold, MembraneThresholdKind, MyAppEntryType} from "../membranes.types";


/**
 * @element membranes-creator-page
 */
export class MembranesCreatorPage extends ScopedElementsMixin(LitElement) {
    constructor() {
        super();
    }


    /** -- Fields -- */
    @state() initialized = false;
    @state() selectedZomeName = ""
    @state() membranesForRole: EntryHashB64[] = [];
    @state() thresholdsForMembrane: EntryHashB64[] = [];
    @state() selectedKind = ""

    @property()
    appEntryTypeStore: Dictionary<[string, boolean][]> = {};

    @contextProvided({ context: membranesContext })
    _viewModel!: MembranesViewModel;


    /** -- Methods -- */

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
        this._viewModel.thresholdStore.subscribe((_v) => {this.requestUpdate()});
        this._viewModel.membraneStore.subscribe((_v) => {this.requestUpdate()});
        await this.refresh();
        this.initialized = true;
        console.log("membranes-creator-page.init() - DONE");
    }


    /** */
    async refresh(_e?: any) {
        console.log("membranes-creator-page.refresh(): Pulling data from DHT")
        await this._viewModel.pullAllFromDht();
    }


    /** */
    onCreateRole(e: any) {
        console.log("onCreateRole() CALLED", e)
        const input = this.shadowRoot!.getElementById("roleNameInput") as HTMLInputElement;
        let res = this._viewModel.createRole(input.value, this.membranesForRole);
        console.log("onCreateRole res:", res)
        input.value = "";
        this.membranesForRole = [];
    }


    /** */
    onAddMembrane(e: any) {
        console.log("onAddMembrane() CALLED", e)
        const membraneSelect = this.shadowRoot!.getElementById("membraneSelectedList") as HTMLSelectElement;
        const membraneEh = membraneSelect.value;
        console.log("membrane eh:", membraneEh);
        this.membranesForRole.push(membraneEh);
        this.requestUpdate();
    }



    /** */
    onCreateMembrane(e: any) {
        console.log("onCreateMembrane() CALLED", e)
        let res = this._viewModel.createMembrane(this.thresholdsForMembrane);
        console.log("onCreateMembrane res:", res)
        this.thresholdsForMembrane = [];
    }


    /** */
    onAddThreshold(e: any) {
        console.log("onAddThreshold() CALLED", e)
        const thresholdSelect = this.shadowRoot!.getElementById("thresholdSelectedList") as HTMLSelectElement;
        const eh = thresholdSelect.value;
        console.log("thresholdSelect eh:", eh);
        this.thresholdsForMembrane.push(eh);
        this.requestUpdate();
    }


    /** */
    onZomeSelect(e: any) {
        console.log("onZomeSelect() CALLED", e)
        const zomeSelector = this.shadowRoot!.getElementById("selectedZome") as HTMLSelectElement;
        this.selectedZomeName = zomeSelector.value;
    }


    /** */
    onKindSelect(e: any) {
        console.log("onKindSelect() CALLED", e);
        let kindName;
        if (!e.hasOwnProperty('originalTarget')) {
            const kindSelector = this.shadowRoot!.getElementById("kindList") as HTMLSelectElement;
            kindName = kindSelector.value;    
        } else { kindName = e.originalTarget.value }
        this.selectedKind = kindName
    }


    /** */
    onCreateThreshold(e: any) {
        console.log("onCreateThreshold() CALLED", e);
        switch (this.selectedKind) {
            case "CreateEntryCountThreshold": {
                const zomeSelector = this.shadowRoot!.getElementById("selectedZome") as HTMLSelectElement;
                const entrySelector = this.shadowRoot!.getElementById("selectedEntryType") as HTMLSelectElement;
                const entryType: MyAppEntryType = {id: entrySelector.selectedIndex, zomeId: zomeSelector.selectedIndex, isPublic: true};  // FIXME
                const input = this.shadowRoot!.getElementById("createEntryCountNumber") as HTMLInputElement;
                const count = Number(input.value);
                const _res = this._viewModel.createCreateEntryCountThreshold(entryType, count);
                break;
            }
            case "VouchThreshold": {
                const input = this.shadowRoot!.getElementById("requiredVouchCount") as HTMLInputElement;
                const count = Number(input.value);
                const input2 = this.shadowRoot!.getElementById("forRoleInput") as HTMLInputElement;
                const forRole = input2.value;
                const input3 = this.shadowRoot!.getElementById("byRoleInput") as HTMLInputElement;
                const byRole = input3.value;
                let _res = this._viewModel.createVouchThreshold(count, byRole, forRole);
                break;
            }
            default:
                break;
        }
        this.selectedZomeName = "";
    }


    /** */
    renderThresholdForm() {
        switch(this.selectedKind) {
            case "CreateEntryCountThreshold": {
                const zomeOptions = Object.entries(this.appEntryTypeStore).map(
                    ([zomeName, _entryDef]) => {
                        return html`
                            <option>${zomeName}</option>`
                    }
                )
                let zomeTypes = Object.entries(this.appEntryTypeStore)
                    .filter((item) => {return item[0] == this.selectedZomeName;})
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
                return html`
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
                return html`
                    <label for="requiredVouchCount">Receive</label>
                    <input type="number" id="requiredVouchCount" style="width: 40px;">
                    <input type="text" id="forRoleInput" style="width: 80px;">
                    <label for="byRoleInput">vouch(es) by a</label>
                    <input type="text" id="byRoleInput" style="width: 80px;">
                `;
                break;
            }
            default:
        };
        return html ``
    }


    /** */
    render() {
        console.log("membranes-creator-page render() START");
        if (!this.initialized) {
            return html`<span>Loading...</span>`;
        }
        /* grab data */
        const thresholds = get(this._viewModel.thresholdStore);
        const membranes = get(this._viewModel.membraneStore);
        const allZomeTypes: [string, boolean][][] = Object.entries(this.appEntryTypeStore)
            .map(([_name, types]) => {return types;})

        /* Elements */
        const membranesForRoleLi = Object.entries(this.membranesForRole).map(
            ([_index, ehB64]) => {
                return html `<li>${ehB64}</li>`
            }
        )
        const membraneOptions = Object.entries(membranes).map(
            ([ehB64, _membrane]) => {
                return html `<option value="${ehB64}">${ehB64.substring(0, 12)}</option>`
            }
        )

        const thresholdsLi = Object.entries(this.thresholdsForMembrane).map(
            ([_index, ehB64]) => {
                return html `<li>${describe_threshold(thresholds[ehB64], allZomeTypes)}</li>`
            }
        )

        const thresholdOptions = Object.entries(thresholds).map(
            ([ehB64, th]) => {
                return html `<option value="${ehB64}">${describe_threshold(th, allZomeTypes)}</option>`
            }
        )

        const kindOptions = Object.keys(MembraneThresholdKind)
            .filter((item) => {return isNaN(Number(item));})
            .map((kind) => {
                return html `<option value="${kind}">${kind}</option>`
            });

        const thresholdForm = this.renderThresholdForm();

        /** render all */
        return html`
        <div>
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
                    ${thresholdForm}
                </div>                    
                <div>
                    <input type="button" value="create" @click=${this.onCreateThreshold}>
                </div>
            </form>
            <!-- NEW Privilege -->
            <hr class="solid">
            <h2>New Privilege</h2>
            <span>FIXME</span>
        </div>
    `;
    }


    /** */
    static get scopedElements() {
        return {
            //'sl-tooltip': SlTooltip,
        };
    }


    static get styles() {
        return [
            css``,
        ];
    }
}