import {css, html} from "lit";
import {state, customElement} from "lit/decorators.js";
import {ZomeElement} from "@ddd-qc/lit-happ";
import {VouchPerspective, VouchZvm} from "../viewModel/vouch.zvm";
import {VouchThreshold} from "../bindings/vouch.types";

/**
 * @element
 */
@customElement("create-vouch-threshold")
export class CreateVouchThreshold extends ZomeElement<VouchPerspective, VouchZvm> {

    /** */
    constructor() {
        super(VouchZvm.DEFAULT_ZOME_NAME)
    }


    @state() private _initialized = false;


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


    describeThreshold(vt: VouchThreshold): string {
        return "Receive " + vt.requiredCount + " \"" + vt.forRole + "\" vouch(es) by a \"" + vt.byRole + "\""
    }


    /** */
    onCreateThreshold() {
        const input = this.shadowRoot!.getElementById("requiredVouchCount") as HTMLInputElement;
        const count = Number(input.value);
        const input2 = this.shadowRoot!.getElementById("forRoleInput") as HTMLInputElement;
        const forRole = input2.value;
        const input3 = this.shadowRoot!.getElementById("byRoleInput") as HTMLInputElement;
        const byRole = input3.value;
        let _res = this._zvm.createThreshold(count, byRole, forRole);
    }


    /** */
    render() {
        console.log("<create-vouch-threshold> render()", this._initialized, this.perspective.roleNames);
        if (!this._initialized) {
            return html`<span>Loading...</span>`;
        }

        const thresholdsLi = Object.values(this.perspective.thresholds).map(
            (vt) => {
                return html `<ul>${this.describeThreshold(vt)}</ul>`
            });

        /** render all */
        return html`
        <div>
          <h1>Vouch Threshold</h1>
          <h2>Existing</h2>
            <ul>
              ${thresholdsLi}
            </ul>            
          <h2>New Vouch Threshold</h2>
          <form>
              <label for="requiredVouchCount">Receive</label>
              <input type="number" id="requiredVouchCount" style="width: 40px;">
              <input type="text" id="forRoleInput" style="width: 80px;">
              <label for="byRoleInput">vouch(es) by a</label>
              <input type="text" id="byRoleInput" style="width: 80px;">
            <div>
              <input type="button" value="create" @click=${this.onCreateThreshold}>
            </div>
          </form>
        </div>
    `;
    }
}