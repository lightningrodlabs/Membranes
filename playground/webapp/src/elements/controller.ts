import {css, html, LitElement} from "lit";
import {property} from "lit/decorators.js";


//import {contextProvided} from "@holochain-open-dev/context";
import { contextProvided } from '@lit-labs/context';

import {Dictionary, htos, taskerContext, TaskList, TaskListEntry} from "../types";
import {HolochainStore} from "../holochain.store";
//import {SlBadge, SlTooltip} from '@scoped-elements/shoelace';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ActionHashB64} from "@holochain-open-dev/core-types";
//import {IMAGE_SCALE} from "../constants";


export const delay = (ms:number) => new Promise(r => setTimeout(r, ms))


/**
 * @element tasker-controller
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

  _selectedList: TaskList | null = null;
  _selectedListAh?: ActionHashB64;

  _pullCount: number = 0

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
    //console.log("*** updated() called !")
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
    console.log("tasker-controller.postInit() - START!");
    // FIXME
    console.log("tasker-controller.postInit() - DONE");
  }

  /** */
  async checkMyRole(_e: any) {
    let response = await this._store.amIEditor();
    console.log("checkMyRole() Editor =", response)
    let span = this.shadowRoot!.getElementById("responseSpan") as HTMLSpanElement;
    span.innerText = "" + response;
    this.requestUpdate();
  }

  /** */
  async refresh(_e: any) {
    console.log("refresh(): Pulling data from DHT")
    await this._store.pullAllFromDht()
    this._pullCount += 1;
    if (this._selectedListAh) {
      this._selectedList = await this._store.getTaskList(this._selectedListAh!)
    }
    this.requestUpdate();
  }


  /** */
  async onCreateList(e: any) {
    //console.log("onCreateList() CALLED", e)
    const input = this.shadowRoot!.getElementById("listTitleInput") as HTMLInputElement;
    //console.log(input)
    let res = this._store.createTaskList(input.value);
    //console.log("onCreateList res:", res)
    input.value = "";
    await this.refresh(null);
  }


  /** */
  async onCreateTask(e: any) {
    //console.log("onCreateTask() CALLED", e)
    /* Assignee */
    const assigneeSelect = this.shadowRoot!.getElementById("selectedAgent") as HTMLSelectElement;
    const assignee = assigneeSelect.value;
    console.log("Assignee value:", assignee);
    /* Title */
    const input = this.shadowRoot!.getElementById("itemTitleInput") as HTMLInputElement;
    //console.log(input)
    let res = this._store.createTaskItem(input.value, assignee, this._selectedListAh!);
    //console.log("onCreateList res:", res)
    input.value = "";
    await this.refresh(null);
  }


  /** */
  async onLockList(e: any) {
    //console.log("onLockList() CALLED", e)
    const input = this.shadowRoot!.getElementById("itemTitleInput") as HTMLInputElement;
    //console.log(input)
    try {
      let res = await this._store.lockTaskList(this._selectedListAh!);
    } catch (e:any) {
      console.error(e);
      alert("Must be editor to lock list 😋")
    }
    //console.log("onLockList res:", res)
    await this.refresh(null);
  }


  /** */
  async onListSelect(e: any) {
    //console.log("onListSelect() CALLED", e)
    //console.log("onListSelect() list:", e.originalTarget.value)
    this._selectedListAh = e.originalTarget.value
    this._selectedList = await this._store.getTaskList(e.originalTarget.value)
    this.requestUpdate();
  }


  /** */
  async onSubmitCompletion(e: any) {
    //console.log("onSubmitCompletion() CALLED", e)
    Object.values(this._selectedList?.items!).map(
        ([ahB64, taskItem]) => {
          const checkbox = this.shadowRoot!.getElementById(ahB64) as HTMLInputElement;
          //console.log("" + checkbox.checked + ". checkbox " + ahB64)
          if (checkbox.checked) {
            this._store.completeTask(ahB64)
          }
        }
    )
    await this.refresh(null);
  }


  /** Render for real-time editing of frame */
  render() {
    console.log("membranes-admin-controller render() START", this._store.taskListStore);

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

    const AgentOptions = Object.entries(this._store.agentStore).map(
        ([index, agentIdB64]) => {
          console.log("" + index + ". " + agentIdB64)
          return html `<option value="${agentIdB64}">${agentIdB64.substring(0, 12)}</option>`
        }
    )


    /** Display selected list */
    let selectedListHtml = html `<h3>\<none\></h3>`
    if (this._selectedList) {
      const listItems = Object.entries(this._selectedList.items).map(
          ([index, [ahB64, taskItem]]) => {
            console.log("taskItem:", taskItem)
            return html`
              <input type="checkbox" id="${ahB64}" value="${ahB64}" .checked=${taskItem.isCompleted} .disabled=${this._selectedList!.isLocked || taskItem.isCompleted}>              
              <label for="${ahB64}"><b>${taskItem.entry.title}</b></label><span> - <i>${htos(taskItem.entry.assignee)}</i></span><br>
              `
          }
      )
      selectedListHtml = html `
        <h2>${this._selectedList.title}</h2>
            <!-- <span>Locked: ${this._selectedList.isLocked}</span> -->
          <input type="button" value="Lock" @click=${this.onLockList} .disabled=${this._selectedList.isLocked}>
          <br/>
          <label for="itemTitleInput">Add task:</label>
          <input type="text" id="itemTitleInput" name="title" .disabled=${this._selectedList.isLocked}>
          <select name="selectedAgent" id="selectedAgent">
            ${AgentOptions}
          </select>
        <input type="button" value="Add" @click=${this.onCreateTask} .disabled=${this._selectedList.isLocked}>
          <form id="listForm">
              ${listItems}
          <input type="button" value="submit" @click=${this.onSubmitCompletion} .disabled=${this._selectedList.isLocked}>
          </form>
      `
    }

    /** render all */
    return html`
      <div>
        <button type="button" @click=${this.refresh}>Refresh</button>        
        <span>${this._store.myAgentPubKey}</span>
        <h1>Tasker: Membranes Playground</h1>
        <ul>${listListLi}</ul>
        <form>
          <label for="listTitleInput">New list:</label>
          <input type="text" id="listTitleInput" name="title">
          <input type="button" value="create" @click=${this.onCreateList}>
        </form>
        <button type="button" @click=${this.checkMyRole}>Am I Editor?</button>
        <span id="responseSpan">unknown</span>
        <h1>
          Selected List:
          <select name="selectedList" id="selectedList" @click=${this.onListSelect}>
            ${listListOption}
          </select>
        </h1>
        ${selectedListHtml}
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
