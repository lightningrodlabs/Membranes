import {css, html} from "lit";
import {property, state} from "lit/decorators.js";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {serializeHash} from "@holochain-open-dev/utils";
import { DnaElement } from "@ddd-qc/lit-happ";
import { TaskerDvm } from "../viewModel/tasker.dvm";
import {emptyTaskerPerspective, TaskerPerspective, TaskListMaterialized} from "../viewModel/tasker.perspective";


/**
 * @element tasker-page
 */
export class TaskerPage extends DnaElement<unknown, TaskerDvm> {

  constructor() {
    super(TaskerDvm.DEFAULT_BASE_ROLE_NAME)
  }

  /** -- Fields -- */
  @state() private _initialized = false;
  @state() private _selectedListEh?: EntryHashB64;

  @property({ type: Boolean, attribute: 'debug' })
  debugMode: boolean = false;


  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  taskerPerspective!: TaskerPerspective;

  /** -- Methods -- */

  protected async dvmUpdated(newDvm: TaskerDvm, oldDvm?: TaskerDvm): Promise<void> {
    console.log("<tasker-page>.dvmUpdated()");
    if (oldDvm) {
      oldDvm.taskerZvm.unsubscribe(this);
    }
    newDvm.taskerZvm.subscribe(this, 'taskerPerspective');
    newDvm.probeAll();
    this._selectedListEh = undefined;
    this.taskerPerspective = emptyTaskerPerspective;
    this._initialized = true;
  }



  // /** After first render only */
  // async firstUpdated() {
  //   this._initialized = true;
  // }


  /** */
  async refresh(_e?: any) {
    //console.log("tasker-page.refresh() called")
    await this._dvm.probeAll();
  }


  /** */
  async onCreateList(e: any) {
    const input = this.shadowRoot!.getElementById("listTitleInput") as HTMLInputElement;
    let res = await this._dvm.taskerZvm.createTaskList(input.value);
    //console.log("onCreateList() res:", res)
    input.value = "";
  }


  /** */
  async onCreateTask(e: any) {
    //console.log("onCreateTask() CALLED", e)
    if (!this._selectedListEh) {
      return;
    }
    /* Assignee */
    const assigneeSelect = this.shadowRoot!.getElementById("selectedAgent") as HTMLSelectElement;
    const assignee = assigneeSelect.value;
    //console.log("Assignee value:", assignee);
    /* Title */
    const input = this.shadowRoot!.getElementById("itemTitleInput") as HTMLInputElement;
    //console.log(input)
    let res = this._dvm.taskerZvm.createTaskItem(input.value, assignee, this._selectedListEh!);
    //console.log("onCreateList res:", res)
    input.value = "";
  }


  /** */
  async onLockList(e: any) {
    //console.log("onLockList() CALLED", this.selectedListEh)
    if (!this._selectedListEh) {
      return;
    }
    try {
      let res = await this._dvm.taskerZvm.lockTaskList(this._selectedListEh!);
      //console.log("onLockList() res =", res)
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
    this._selectedListEh = selector.value;
  }


  /** */
  async onSubmitCompletion(selectedList: TaskListMaterialized | null) {
    //console.log("onSubmitCompletion() CALLED", e)
    if (!selectedList) {
      return;
    }
    for (const [ehb64, taskItem] of selectedList.items) {
      const checkbox = this.shadowRoot!.getElementById(ehb64) as HTMLInputElement;
      //console.log("" + checkbox.checked + ". checkbox " + ehb64)
      if (checkbox.checked) {
        await this._dvm.taskerZvm.completeTask(ehb64)
      }
    }

    this._dvm.taskerZvm.probeAll();
    //this.requestUpdate();
  }


  /** */
  render() {
    console.log("<tasker-page.render()> render()", this._initialized);
    if (!this._initialized) {
      return html`<span>Loading...</span>`;
    }
    let taskListEntries = this._dvm.taskerZvm.perspective.taskListEntries;
    console.log("<tasker-page.render()> render() taskListEntries", taskListEntries);
    let agents: AgentPubKeyB64[] = this._dvm.AgentDirectoryZvm.perspective.agents;
    let myRoles = this._dvm.taskerZvm.perspective.myRoles;
    let selectedList: TaskListMaterialized | null = null;
    if (this._selectedListEh) {
      selectedList = this._dvm.taskerZvm.perspective.taskLists[this._selectedListEh];
      if (!selectedList) {
        console.warn("No list found for selectedListEh", this._selectedListEh);
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
          <select name="selectedAgent" id="selectedAgent" .disabled=${selectedList.isLocked}>
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

}
