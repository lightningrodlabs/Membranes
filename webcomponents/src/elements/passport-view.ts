import {html} from "lit";
import {state, customElement} from "lit/decorators.js";
import { ZomeElement } from "@ddd-qc/lit-happ";

import {MembranesZvm} from "../viewModel/membranes.zvm";
import {MembranesPerspective} from "../viewModel/membranes.perspective";


/**
 * @element
 */
@customElement("passport-view")
export class PassportView extends ZomeElement<MembranesPerspective, MembranesZvm>  {
  /** */
  constructor() {
    super(MembranesZvm.DEFAULT_ZOME_NAME)
  }


  /** -- Fields -- */
  @state() private _initialized = false;


  /** -- Methods -- */

  /** After first render only */
  override firstUpdated() {
    this._initialized = true;
  }


  /** */
  async claimAll(_e?:any) {
     await this._zvm.claimAll();
  }


  /** */
  override render() {
    console.log("<passport-view> render()", this._initialized);
      if (!this._initialized) {
          return html`<span>Loading...</span>`;
      }
    /* My Role Claims */
    const myRoleClaimsLi = Object.entries(this.perspective.myRoleClaims).map(
        ([ehB64, claim]) => {
          //console.log("membrane:", ehB64)
          return html `<li title=${ehB64}><abbr>${claim.role.name} - (crossed membrane index:${claim.membraneIndex})</abbr></li>`
        }
    )
    /* My Membrane Claims */
    const myMembraneClaimsLi = Object.entries(this.perspective.myMembraneClaims).map(
        ([_ehB64, claim]) => {
          //console.log("membrane claim:", ehB64, claim)
          return html `<li title="proofs: ${JSON.stringify(claim.proofs)}"><abbr>${this._zvm.findMembrane(claim.membrane)}</abbr></li>`
        }
    )

    /* render all */
    return html`
      <div>     
        <h2>My Passport <button type="button" @click=${this.claimAll}>Claim all</button></h2>
        <h3>Roles</h3>
        <ul>${myRoleClaimsLi}</ul>
        <h3>Membranes</h3>
        <ul>${myMembraneClaimsLi}</ul>
      </div>
    `;
  }
}
