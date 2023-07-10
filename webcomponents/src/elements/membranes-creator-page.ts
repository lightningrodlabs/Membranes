import {css, html} from "lit";
import {property, state} from "lit/decorators.js";
import {EntryHashB64} from "@holochain/client";

import { ZomeElement } from "@ddd-qc/lit-happ";
import {describe_threshold, MembranesZvm} from "../viewModel/membranes.zvm";
import {MembranesPerspective} from "../viewModel/membranes.perspective";


/**
 * @element membranes-creator-page
 */
export class MembranesCreatorPage extends ZomeElement<MembranesPerspective, MembranesZvm> {
  /** */
  constructor() {
    super(MembranesZvm.DEFAULT_ZOME_NAME)
  }


    /** -- Fields -- */
    @state() private _initialized = false;
    @state() private _selectedZomeName = ""
    @state() private _membranesForCurrentRole: EntryHashB64[] = [];
    @state() private _thresholdsForCurrentMembrane: EntryHashB64[] = [];

    @property()
    allAppEntryTypes: Record<string, [string, boolean][]> = {};


    /** -- Methods -- */

    /** After first render only */
    async firstUpdated() {
        //console.log("membranes-creator-page first update done!")
        await this._zvm.probeAll();
        this._initialized = true;
        //console.log("membranes-creator-page.init() - DONE");
    }


    /** */
    async refresh(_e?: any) {
        //console.log("membranes-creator-page.refresh(): Pulling data from DHT")
        await this._zvm.probeAll();
    }


    /** */
    onCreateRole(e: any) {
        console.log("onCreateRole() CALLED", e)
        const input = this.shadowRoot!.getElementById("roleNameInput") as HTMLInputElement;
        let res = this._zvm.createRole(input.value, this._membranesForCurrentRole);
        console.log("onCreateRole res:", res)
        input.value = "";
        this._membranesForCurrentRole = [];
    }


    /** */
    onAddMembrane(e: any) {
        console.log("onAddMembrane() CALLED", e)
        const membraneSelect = this.shadowRoot!.getElementById("membraneSelectedList") as HTMLSelectElement;
        const membraneEh = membraneSelect.value;
        console.log("membrane eh:", membraneEh);
        this._membranesForCurrentRole.push(membraneEh);
        this.requestUpdate();
    }



    /** */
    onCreateMembrane(e: any) {
        console.log("onCreateMembrane() CALLED", e)
        let res = this._zvm.createMembrane(this._thresholdsForCurrentMembrane);
        console.log("onCreateMembrane res:", res)
        this._thresholdsForCurrentMembrane = [];
    }


    /** */
    onAddThreshold(e: any) {
        console.log("onAddThreshold() CALLED", e)
        const thresholdSelect = this.shadowRoot!.getElementById("thresholdSelectedList") as HTMLSelectElement;
        const eh = thresholdSelect.value;
        console.log("thresholdSelect eh:", eh);
        this._thresholdsForCurrentMembrane.push(eh);
        this.requestUpdate();
    }


    /** */
    onZomeSelect(e: any) {
        console.log("onZomeSelect() CALLED", e)
        const zomeSelector = this.shadowRoot!.getElementById("selectedZome") as HTMLSelectElement;
        this._selectedZomeName = zomeSelector.value;
    }


    // renderThresholdForm() {
    //     switch(this._selectedKind) {
    //         case "CreateEntryCount": {
    //             const zomeOptions = Object.entries(this.allAppEntryTypes).map(
    //                 ([zomeName, _entryDef]) => {
    //                     return html`
    //                         <option>${zomeName}</option>`
    //                 }
    //             )
    //             let zomeTypes = Object.entries(this.allAppEntryTypes)
    //                 .filter((item) => {return item[0] == this._selectedZomeName;})
    //                 .map((item) => {return item[1]});
    //             console.log({zomeTypes})
    //             let entryTypeOptions = null;
    //             if (zomeTypes.length > 0) {
    //                 entryTypeOptions = Object.entries(zomeTypes[0]).map(
    //                     ([_zomeName, pair]) => {
    //                         return html`
    //                             <option>${pair[0]}</option>`;
    //                     });
    //             }
    //             console.log({entryTypeOptions})
    //             return html`
    //                 <label for="createEntryCountNumber">Create</label>
    //                 <input type="number" id="createEntryCountNumber" style="width: 40px;">
    //                 <select name="selectedZome" id="selectedZome" @click=${this.onZomeSelect}>
    //                     ${zomeOptions}
    //                 </select>
    //                 <span>::</span>
    //                 <select name="selectedEntryType" id="selectedEntryType">
    //                     ${entryTypeOptions}
    //                 </select>
    //                 <span>entries.</span>
    //             `;
    //             break;
    //         }
    //         case "Vouch":  {
    //             return html`
    //                 <label for="requiredVouchCount">Receive</label>
    //                 <input type="number" id="requiredVouchCount" style="width: 40px;">
    //                 <input type="text" id="forRoleInput" style="width: 80px;">
    //                 <label for="byRoleInput">vouch(es) by a</label>
    //                 <input type="text" id="byRoleInput" style="width: 80px;">
    //             `;
    //             break;
    //         }
    //         default:
    //     };
    //     return html ``
    // }


    /** */
    render() {
        console.log("<membranes-creator-page> render()", this._initialized);
        if (!this._initialized) {
            return html`<span>Loading...</span>`;
        }
        /* grab data */
        const thresholds = this.perspective.thresholds;
        const membranes = this.perspective.membranes;
        const allZomeTypes: [string, boolean][][] = Object.entries(this.allAppEntryTypes)
            .map(([_name, types]) => {return types;})

        /* Elements */
        const membranesForRoleLi = Object.entries(this._membranesForCurrentRole).map(
            ([_index, ehB64]) => {
                return html `<li>${ehB64}</li>`
            }
        )
        const membraneOptions = Object.entries(membranes).map(
            ([ehB64, _membrane]) => {
                return html `<option value="${ehB64}">${ehB64.substring(0, 12)}</option>`
            }
        )

        const thresholdsLi = Object.entries(this._thresholdsForCurrentMembrane).map(
            ([_index, ehB64]) => {
                return html `<li>${describe_threshold(thresholds[ehB64], allZomeTypes)}: ${ehB64}</li>`
            }
        )

        const thresholdOptions = Object.entries(thresholds).map(
            ([ehB64, th]) => {
                return html `<option value="${ehB64}">${describe_threshold(th, allZomeTypes)}: ${ehB64}</option>`
            }
        )

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
                  <div style="margin-top:10px;">
                      <input type="button" value="create" @click=${this.onCreateRole}>                      
                  </div>
              </form>
            <hr class="solid">
            <!-- NEW Membrane -->
            <h2>New Membrane</h2>
            <form>
                Thresholds:
                <ul id="thresholdsList">${thresholdsLi}</ul>
                <select name="thresholdSelectedList" id="thresholdSelectedList">
                    ${thresholdOptions}
                </select>
                <input type="button" value="Add" @click=${this.onAddThreshold}>
                <div style="margin-top:10px;">
                    <input type="button" value="create" @click=${this.onCreateMembrane}>
                </div>
            </form>            
            <!-- NEW Threshold -->
            <hr class="solid">
            <h2>
                New Threshold
            </h2>
            <span>New thresholds can only be created in threshold-plugin UI</span>
            <!-- NEW Privilege -->
            <hr class="solid">
            <h2>New Privilege</h2>
            <span>FIXME</span>
        </div>
    `;
    }


    /** */
    static get styles() {
        return [
            css``,
        ];
    }
}