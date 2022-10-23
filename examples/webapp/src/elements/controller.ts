import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";


//import {contextProvided} from "@holochain-open-dev/context";
import { contextProvided } from '@lit-labs/context';

import {taskerContext, TaskList, TaskListEntry} from "../types";
import {HolochainStore} from "../holochain.store";
//import {SlBadge, SlTooltip} from '@scoped-elements/shoelace';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
//import {IMAGE_SCALE} from "../constants";


export const delay = (ms:number) => new Promise(r => setTimeout(r, ms))

const toHHMMSS = function (str: string) {
  var sec_num = parseInt(str, 10); // don't forget the second param
  var hours:any   = Math.floor(sec_num / 3600);
  var minutes:any = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds:any = sec_num - (hours * 3600) - (minutes * 60);

  if (hours   < 10) {hours   = "0"+hours;}
  if (minutes < 10) {minutes = "0"+minutes;}
  if (seconds < 10) {seconds = "0"+seconds;}
  return hours+':'+minutes+':'+seconds;
}




/**
 * @element place-controller
 */
export class TaskerController extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property({ type: Boolean, attribute: 'debug' })
  debugMode: boolean = false;

  /** Dependencies */
  @contextProvided({ context: taskerContext })
  _store!: HolochainStore;


  /** Private properties */
  _canAutoRefresh = true;

  _selectedList?: TaskList;


  /** Getters */


  // get datePickerElem(): any {
  //   return this.shadowRoot!.getElementById("my-date-picker");
  // }
  //
  // get loadingOverlayElem(): HTMLDivElement {
  //   return this.shadowRoot!.getElementById("loading-overlay") as HTMLDivElement;
  // }


  /** After first render only */
  async firstUpdated() {
    console.log("place-controller first update done!")
    await this.init();
  }


  /** After each render */
  async updated(changedProperties: any) {
    console.log("*** updated() called !")
  }


  /**
   * Called after first update
   * Get local snapshots and latest from DHT
   */
  private async init() {
    console.log("place-controller.init() - START!");

    /** Wait a second for startup? */
    await delay(1 * 1000);

    /** Get latest from DHT and store it */
    await this._store.pullAllFromDht();

    /** Done */
    console.log("place-controller.init() - DONE");
  }



  /** Called once after init is done and canvas has been rendered */
  private async postInit() {
    console.log("place-controller.postInit() - START!");
    // FIXME
    console.log("place-controller.postInit() - DONE");
  }


  /** */
  async refresh(_e: any) {
    console.log("refresh(): Pulling data from DHT")
    await this._store.pullAllFromDht()
    this.requestUpdate();
  }


  async onCreateList(e: any) {
    console.log("onCreateList() CALLED", e)
    const input = this.shadowRoot!.getElementById("titleInput") as HTMLInputElement;
    console.log(input)
    let res = this._store.createTaskList(input.value);
    console.log("onCreateList res:", res)
    input.value = "";
    await this.refresh(null);
  }

  async onListSelect(e: any) {
    console.log("onListSelect() CALLED", e)
  
    //let list = this._store.createTaskList(e.detail.value);
    //console.log("onListSelect() list:", list)
    //this._selectedList = list
    this.requestUpdate();
  }


  /** Render for real-time editing of frame */
  render() {
    console.log("controller render() START", this._store.taskListStore);

    const listListLi = Object.entries(this._store.taskListStore).map(
        ([ahB64, taskList]) => {
          //console.log("taskList:", ahB64)
          return html `<li>${taskList.title}</li>`
        }
    )

    const listListOption = Object.entries(this._store.taskListStore).map(
      ([ahB64, taskList]) => {
        //console.log("taskList:", ahB64)
        return html `<option value="${ahB64}">${taskList.title}</option>`
      }
  )


    /** render all */
    return html`
      <div>
        <button type="button" @click=${this.refresh}>Refresh</button>
        <h3>New list:</h3>
        <form>
          <label for="titleInput">Title:</label><br>
          <input type="text" id="titleInput" name="title">
          <input type="button" value="create" @click=${this.onCreateList}>
        </form>
        <h1>Lists</h1>
        <ul>${listListLi}</ul>
        <h1>Lists:</h1>
        <label for="selectedList">Choose a TaskList:</label>
        <select name="selectedList" id="selectedList" @click=${this.onListSelect}>
            ${listListOption}
        </select>
        <h1>Selected List</h1>
        <h3>${this._selectedList? this._selectedList.title : "<none>"}</h3>
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
