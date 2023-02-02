import {css, html} from "lit";
import {property, state} from "lit/decorators.js";
import { ZomeElement } from "@ddd-qc/lit-happ";

import {describe_threshold, MembranesZvm} from "../viewModel/membranes.zvm";
import {MembranesPerspective} from "../viewModel/membranes.perspective";


/**
 * @element membranes-dashboard
 */
export class MembranesDashboard extends ZomeElement<MembranesPerspective, MembranesZvm>  {
  /** */
  constructor() {
    super(MembranesZvm.DEFAULT_ZOME_NAME)
  }


  /** -- Fields -- */
  @state() private _initialized = false;

  @property()
  allAppEntryTypes: Record<string, [string, boolean][]> = {};


  /** -- Methods -- */

  /** After first render only */
  async firstUpdated() {
    await this.refresh();
    this._initialized = true;
  }


  /** */
  async refresh(_e?: any) {
    console.log("membranes-dashboard.refresh(): Pulling data from DHT")
    await this._zvm.probeAll();
  }


  /** */
  async claimAll(_e?:any) {
     await this._zvm.claimAll();
  }


  /** */
  render() {
    console.log("<membranes-dashboard> render()", this._initialized);
      if (!this._initialized) {
          return html`<span>Loading...</span>`;
      }
    /* Grab data */
    const allZomeEntryTypes: [string, boolean][][] = Object.entries(this.allAppEntryTypes)
        .map(([_name, types]) => {return types;})
    //console.log(roles)
      /* Roles Li */
      const typesLi = Object.entries(this.perspective.thresholdTypes).map(
          ([typeName, zomeName]) => {
              //console.log("MembraneLi", MembraneLi)
              return html `
              <li style="margin-top:10px;" title=${typeName}>
                  <b>${typeName}</b> from zome <i>${zomeName}</i>
              </li>`
          }
      )
    /* Roles Li */
    const rolesLi = Object.entries(this.perspective.roles).map(
        ([ehB64, role]) => {
          //console.log("Role", role)
          const MembraneLi = Object.values(role.enteringMembranes).map(
              (membrane) => {
                return html `<li>${this._zvm.findMembrane(membrane)}</li>`
              }
          )
          //console.log("MembraneLi", MembraneLi)
          return html `<li style="margin-top:10px;" title=${ehB64}>
            <abbr><b>${role.name}</b></abbr>
              <br/>
              &nbsp;&nbsp;&nbsp;Membranes:
            <ul>
              ${MembraneLi}
            </ul>
          </li>`
        }
    )
    /* Membranes */
    const membranesLi = Object.entries(this.perspective.membranes).map(
        ([ehB64, membrane]) => {
          //console.log("membrane:", membrane)
          const thresholdLi = Object.entries(membrane.thresholds).map(
              ([_index, th]) => {
                return html `<li>${describe_threshold(th, allZomeEntryTypes)}</li>`
              }
          )
          return html `
          <li style="margin-top:10px;">
              <i>${ehB64}</i>
              <br/>
              &nbsp;&nbsp;&nbsp;Thresholds:
            <ul>
              ${thresholdLi}
            </ul>
          </li>`
        }
    )
    /* Thresholds */
    const thresholdsLi = Object.entries(this.perspective.thresholds).map(
        ([ehB64, threshold]) => {
          //console.log({threshold})
          let desc = describe_threshold(threshold, allZomeEntryTypes);
          return html `<li title=${ehB64}><abbr>${desc}</abbr></li>`
        }
    )
    /* My Role Claims */
    const myRoleClaimsLi = Object.entries(this.perspective.myRoleClaims).map(
        ([ehB64, claim]) => {
          //console.log("membrane:", ehB64)
          return html `<li title=${ehB64}><abbr>${claim.role.name} - (crossed membrane index:${claim.membraneIndex})</abbr></li>`
        }
    )
    /* My Membrane Claims */
    const myMembraneClaimsLi = Object.entries(this.perspective.myMembraneClaims).map(
        ([ehB64, claim]) => {
          //console.log("membrane claim:", ehB64, claim)
          return html `<li title="proofs: ${JSON.stringify(claim.proofs)}"><abbr>${this._zvm.findMembrane(claim.membrane)}</abbr></li>`
        }
    )
    /** render all */
    return html`
      <div>
        <h1>Membranes Dashboard</h1>
        <h2>Registered threshold types</h2>
        <ul>${typesLi}</ul>
        <h2>Roles</h2>
        <ul>${rolesLi}</ul>        
        <h2>Membranes</h2>
        <ul>${membranesLi}</ul>
        <h2 style="margin-top:30px;margin-bottom:0px;">Thresholds</h2>
        <ul>${thresholdsLi}</ul>
        <hr class="solid">        
        <h2>My Passport <button type="button" @click=${this.claimAll}>Claim all</button></h2>
        <h3>Roles</h3>
        <ul>${myRoleClaimsLi}</ul>
        <h3>Membranes</h3>
        <ul>${myMembraneClaimsLi}</ul>
      </div>
    `;
  }
}
