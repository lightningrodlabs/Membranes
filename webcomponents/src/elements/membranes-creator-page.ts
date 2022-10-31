import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";


//import {contextProvided} from "@holochain-open-dev/context";
import { contextProvided } from '@lit-labs/context';

//import {SlBadge, SlTooltip} from '@scoped-elements/shoelace';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ActionHashB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {MembranesViewModel, membranesContext} from "../membranes.vm";
import {EntryHash} from "@holochain/client";
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

    /** Dependencies */
    @contextProvided({ context: membranesContext })
    _viewModel!: MembranesViewModel;


    /** Private properties */
    private _pullCount: number = 0

    private _membranesForRole: EntryHashB64[] = [];
    private _thresoldsForMembrane: EntryHashB64[] = [];

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
        let res = this._viewModel.createMembrane(this._thresoldsForMembrane);
        console.log("onCreateMembrane res:", res)
        this._thresoldsForMembrane = [];
        await this.refresh(null);
    }


    /** */
    async onAddThreshold(e: any) {
        console.log("onAddThreshold() CALLED", e)
        const thresholdSelect = this.shadowRoot!.getElementById("thresholdSelectedList") as HTMLSelectElement;
        const eh = thresholdSelect.value;
        console.log("thresholdSelect eh:", eh);
        this._thresoldsForMembrane.push(eh);
        this.requestUpdate();
    }



    /** */
    render() {
        console.log("membranes-creator-page render() START");

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

        const thresholdsLi = Object.entries(this._thresoldsForMembrane).map(
            ([_index, ehB64]) => {
                return html `<li>${ehB64}</li>`
            }
        )
        const thresholdOptions = Object.entries(this._viewModel.thresholdStore).map(
            ([ehB64, _th]) => {
                return html `<option value="${ehB64}">${ehB64.substring(0, 12)}</option>`
            }
        )

        /** render all */
        return html`
        <div>
            <button type="button" @click=${this.refresh}>Refresh</button>        
            <span>${this._viewModel.myAgentPubKey}</span>
            <h1>Membrane Creator</h1>
            <!-- NEW ROLE -->
            <h2>New Role</h2>
              <form>
                  <label for="roleNameInput">Name:</label>
                  <input type="text" id="roleNameInput" name="name">
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
            <h2>New Threshold</h2>
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