import {css, html, LitElement} from "lit";
import {property, state} from "lit/decorators.js";


//import {contextProvided} from "@holochain-open-dev/context";
import { contextProvided } from '@lit-labs/context';

import {TaskList} from "../tasker.vm";
import {TaskerViewModel, taskerContext} from "../tasker.vm";
//import {SlBadge, SlTooltip} from '@scoped-elements/shoelace';
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {agentDirectoryContext, AgentDirectoryViewModel} from "@ddd-qc/agent-directory";
import {serializeHash} from "@holochain-open-dev/utils";
//import {IMAGE_SCALE} from "../constants";


export const delay = (ms:number) => new Promise(r => setTimeout(r, ms))


/**
 * @element tasker-page
 */
export class TaskerPage extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** state */
  @state() initialized = false;
  @state() selectedListEh?: EntryHashB64;


  /** Public attributes */
  @property({ type: Boolean, attribute: 'debug' })
  debugMode: boolean = false;

  /** Dependencies */
  @contextProvided({ context: taskerContext })
  _taskerViewModel!: TaskerViewModel; // WARN is actually undefined at startup
  @contextProvided({ context: agentDirectoryContext })
  _agentDirectoryViewModel!: AgentDirectoryViewModel; // WARN is actually undefined at startup


  /** -- */

  /** After first render only */
  firstUpdated() {
    //console.log("first update done!")
    this.init();
  }


  /** After each render */
  async updated(changedProperties: any) {
    console.log("*** tasker-page.updated() called !")
    //console.log(this.localTaskListStore)
  }


  /**
   * Called after first update
   * Get local snapshots and latest from DHT
   */
  private async init() {
    console.log("tasker-page.init() - START!");
    this._taskerViewModel.subscribe(this);
    this._agentDirectoryViewModel.subscribe(this);
    await this.refresh();
    this.initialized = true;
    /** Done */
    console.log("tasker-page.init() - DONE");
  }


  /** */
  async refresh(_e?: any) {
    console.log("refresh(): Pulling data from DHT")
    await this._taskerViewModel.pullAllFromDht();
    await this._agentDirectoryViewModel.pullAllFromDht();
  }


  /** */
  async onCreateList(e: any) {
    const input = this.shadowRoot!.getElementById("listTitleInput") as HTMLInputElement;
    let res = await this._taskerViewModel.createTaskList(input.value);
    //console.log("onCreateList() res:", res)
    input.value = "";
  }


  /** */
  async onCreateTask(e: any) {
    //console.log("onCreateTask() CALLED", e)
    if (!this.selectedListEh) {
      return;
    }
    /* Assignee */
    const assigneeSelect = this.shadowRoot!.getElementById("selectedAgent") as HTMLSelectElement;
    const assignee = assigneeSelect.value;
    //console.log("Assignee value:", assignee);
    /* Title */
    const input = this.shadowRoot!.getElementById("itemTitleInput") as HTMLInputElement;
    //console.log(input)
    let res = this._taskerViewModel.createTaskItem(input.value, assignee, this.selectedListEh!);
    //console.log("onCreateList res:", res)
    input.value = "";
  }


  /** */
  async onLockList(e: any) {
    console.log("onLockList() CALLED", this.selectedListEh)
    if (!this.selectedListEh) {
      return;
    }
    try {
      let res = await this._taskerViewModel.lockTaskList(this.selectedListEh!);
      console.log("onLockList() res =", res)
    } catch (e:any) {
      console.warn(e);
      alert("Must be editor to lock list 😋")
    }
  }


  /** */
  async onListSelect(e: any) {
    //console.log("onListSelect() CALLED", e)
    const selector = this.shadowRoot!.getElementById("listSelector") as HTMLSelectElement;
    if (!selector || !selector.value) {
      console.warn("No list selector value", selector);
      return;
    }
    this.selectedListEh = selector.value;
  }


  /** */
  async onSubmitCompletion(selectedList: TaskList | null) {
    //console.log("onSubmitCompletion() CALLED", e)
    if (!selectedList) {
      return;
    }
    for (const [ehb64, taskItem] of selectedList.items) {
      const checkbox = this.shadowRoot!.getElementById(ehb64) as HTMLInputElement;
      //console.log("" + checkbox.checked + ". checkbox " + ehb64)
      if (checkbox.checked) {
        await this._taskerViewModel.completeTask(ehb64)
      }
    }

    this._taskerViewModel.pullAllFromDht();
    this.requestUpdate();
  }


  /** */
  render() {
    console.log("tasker-page.render() START");

    if (!this.initialized) {
      return html`<span>Loading...</span>`;
    }

    let taskListEntries = this._taskerViewModel.taskListEntries();
    let agents: AgentPubKeyB64[] = this._agentDirectoryViewModel.agents();
    let myRoles = this._taskerViewModel.myRoles();
    let selectedList: TaskList | null = null;
    if (this.selectedListEh) {
      selectedList = this._taskerViewModel.taskLists()[this.selectedListEh];
      if (!selectedList) {
        console.warn("No list found for selectedListEh", this.selectedListEh);
        this.refresh();
        return html`<span>Loading...</span>`;
      }
    }

    //console.log("tasker-page.render() selectedList", selectedList);

    const listEntryLi = Object.entries(taskListEntries).map(
        ([_ehB64, taskList]) => {
          //console.log("localTaskList.item:", ahB64)
          return html `<li>${taskList.title}</li>`
        }
    )

    const listEntryOption = Object.entries(taskListEntries).map(
      ([ehB64, taskList]) => {
        //console.log("taskList:", ahB64)
        return html `<option value="${ehB64}">${taskList.title}</option>`
      }
    )

    const AgentOptions = Object.entries(agents).map(
        ([index, agentIdB64]) => {
          //console.log("" + index + ". " + agentIdB64)
          return html `<option value="${agentIdB64}">${agentIdB64.substring(0, 12)}</option>`
        }
    )


    /** Display selected list */
    let selectedListHtml = html `<h3>none</h3>`
    if (selectedList) {
      const listItems = Object.entries(selectedList.items).map(
          ([index, [ahB64, taskItem]]) => {
            ///console.log("taskItem:", taskItem)
            return html`
              <input type="checkbox" id="${ahB64}" value="${ahB64}" .checked=${taskItem.isCompleted} .disabled=${selectedList!.isLocked || taskItem.isCompleted}>              
              <label for="${ahB64}"><b>${taskItem.entry.title}</b></label><span> - <i>${serializeHash(taskItem.entry.assignee)}</i></span><br>
              `
          }
      )
      selectedListHtml = html `
        <h2>${selectedList.title}</h2>
            <!-- <span>Locked: ${selectedList.isLocked}</span> -->
          <input type="button" value="Lock" @click=${this.onLockList} .disabled=${selectedList.isLocked}>
          <br/>
          <label for="itemTitleInput">Add task:</label>
          <input type="text" id="itemTitleInput" name="title" .disabled=${selectedList.isLocked}>
          <select name="selectedAgent" id="selectedAgent">
            ${AgentOptions}
          </select>
        <input type="button" value="Add" @click=${this.onCreateTask} .disabled=${selectedList.isLocked}>
          <form id="listForm">
              ${listItems}
          <input type="button" value="submit" @click=${() => this.onSubmitCompletion(selectedList)} .disabled=${selectedList.isLocked}>
          </form>
      `
    }

    /** render all */
    let myRolesStr = "none"
    if (myRoles.length > 0) {
      myRolesStr = ""
      for (const name of myRoles) {
        myRolesStr += ", " + name
      }
    }
    return html`
      <div>
        <h1>Tasker: Membranes playground</h1>
        <span id="responseSpan"><b>My Roles:</b> ${myRolesStr}</span>
        <ul>${listEntryLi}</ul>
          <label for="listTitleInput">New list:</label>
          <input type="text" id="listTitleInput" name="title">
          <input type="button" value="create" @click=${this.onCreateList}>
        <h2>
          Selected List:
          <select name="listSelector" id="listSelector" @click=${this.onListSelect}>
            ${listEntryOption}
          </select>
        </h2>
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
