import {html} from "lit";
import {state, customElement} from "lit/decorators.js";
import {EntryId, ZomeElement} from "@ddd-qc/lit-happ";

import {describeThreshold, MembranesZvm} from "../viewModel/membranes.zvm";
import {MembranesPerspective} from "../viewModel/membranes.perspective";


/**
 * @element
 */
@customElement("membranes-dashboard")
export class MembranesDashboard extends ZomeElement<MembranesPerspective, MembranesZvm>  {
  /** */
  constructor() {
    super(MembranesZvm.DEFAULT_ZOME_NAME)
  }


  /** -- Fields -- */
  @state() private _initialized = false;


  /** -- Methods -- */

  /** After first render only */
  override firstUpdated() {
    this.refresh();
    this._initialized = true;
  }


  /** */
  refresh(_e?: any) {
    console.log("membranes-dashboard.refresh(): Pulling data from DHT")
    this._zvm.probeAll();
  }


  /** */
  async claimAll(_e?:any) {
     await this._zvm.claimAll();
  }


  /** */
  override render() {
    console.log("<membranes-dashboard> render()", this._initialized);
      if (!this._initialized) {
          return html`<span>Loading...</span>`;
      }
    /* Grab data */
    // const allZomeEntryTypes = Object.entries(this._zvm.allEntryDefs)
    //     .map(([_name, types]) => {return types;})
    //console.log(roles)
      /* Roles Li */
      const typesLi = Object.entries(this.perspective.thresholdTypes).map(
          ([typeName, zomeName]) => {
              //console.log("MembraneLi", MembraneLi)
              return html `
              <li style="margin-top:10px;" title=${typeName}>
                  <b>${typeName}</b> - <i>${zomeName}</i>
              </li>`
          }
      )
    /* Roles Li */
    const rolesLi = Object.entries(this.perspective.roles).map(
        ([ehB64, role]) => {
          //console.log("Role", role)
          const MembraneLi = role.enteringMembranes.map(
              (membrane) => {
                  const memEhB64 = this._zvm.findMembrane(membrane);
                  const m = memEhB64? new EntryId(memEhB64).short :"";
                return html `<li>${m}</li>`
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
          const thresholdLi = membrane.thresholds.map(
              (th) => {
                return html `<li>${describeThreshold(th, this._zvm)}</li>`
              }
          )
          return html `
          <li style="margin-top:10px;">
              <b>${new EntryId(ehB64).short}</b>
              <br/>
            <ol>
              ${thresholdLi}
            </ol>
          </li>`
        }
    )
    /* Thresholds */
    const thresholdsLi = Object.entries(this.perspective.thresholds).map(
        ([ehB64, threshold]) => {
          //const eh = new EntryId(ehB64);
          //console.log({threshold})
          //let desc =  + ": " + eh.short;
          return html `<li title=${ehB64}><abbr>${threshold.typeName}</abbr>: ${describeThreshold(threshold, this._zvm)}</li>`
        }
    )
    /** render all */
    return html`
        <div>
        <h1>Membranes Dashboard</h1>
        <h2>Registered threshold types</h2>
        <ul>${typesLi}</ul>
        <h2>Roles <span style="font-size:16px;color:grey">(or)</span></h2>
        <ul>${rolesLi}</ul>        
        <h2>Membranes <span style="font-size:16px; color:grey">(and)</span></h2>
        <ul>${membranesLi}</ul>
        <h2 style="margin-top:30px;margin-bottom:0px;">Thresholds</h2>
        <ul>${thresholdsLi}</ul>
      </div>
    `;
  }
}
