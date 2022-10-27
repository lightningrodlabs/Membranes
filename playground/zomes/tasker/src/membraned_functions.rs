use hdk::prelude::*;
use hdk::prelude::holo_hash::{ActionHashB64};
use membranes_types::{ClaimMembraneInput, ClaimRoleInput, HasRoleInput, Membrane, MembraneRole};
use tasker_model::*;
use crate::basic_functions::lock_task_list;
use crate::call_membranes_zome;
use crate::helpers::am_i_editor;
use crate::holo_hash::{AgentPubKeyB64, EntryHashB64};
//
// #[hdk_extern]
// fn create_task_list(title: String) -> ExternResult<ActionHashB64> {
//    let ah = create_entry(TaskerEntry::TaskList(TaskList {title}))?;
//    let directory_address = Path::from("lists")
//       .path_entry_hash()
//       .expect("TaskLists Path should hash");
//    let _ = create_link(
//       directory_address,
//       ah.clone(),
//       TaskerLink::TaskLists,
//       LinkTag::from(()),
//    )?;
//    return Ok(ah.into());
// }
//
//
// #[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
// #[serde(rename_all = "camelCase")]
// pub struct CreateTaskItemInput {
//    pub title: String,
//    pub assignee: AgentPubKeyB64,
//    pub list_ah: ActionHashB64
// }
//
// #[hdk_extern]
// fn create_task_item(input: CreateTaskItemInput) -> ExternResult<ActionHashB64> {
//    let taskItem = TaskItem {title: input.title, assignee: input.assignee.into(), list_ah: input.list_ah.clone().into() };
//    let ah = create_entry(TaskerEntry::TaskItem(taskItem))?;
//    let _ = create_link(
//       input.list_ah,
//       ah.clone(),
//       TaskerLink::Item,
//       LinkTag::from(()),
//    )?;
//    return Ok(ah.into());
// }
//
//
// #[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
// #[serde(rename_all = "camelCase")]
// pub struct ReassignTaskInput {
//    pub task_ah: ActionHashB64,
//    pub assignee: AgentPubKeyB64,
// }
//
// #[hdk_extern]
// fn reassign_task(input: ReassignTaskInput) -> ExternResult<ActionHashB64> {
//    let (_eh, item) = zome_utils::get_typed_from_ah::<TaskItem>(input.task_ah.clone().into())?; // FIXME should get latest and not content
//    let newItem = TaskItem {title: item.title, assignee: input.assignee.into(), list_ah: item.list_ah};
//    let res = update_entry(input.task_ah.into(), TaskerEntry::TaskItem(newItem))?;
//    return Ok(res.into());
// }
//
//
// #[hdk_extern]
// fn complete_task(task_ah: ActionHashB64) -> ExternResult<ActionHashB64> {
//    let directory_address = Path::from("completed")
//       .path_entry_hash()
//       .expect("completed path should hash");
//    let res = create_link(
//       task_ah.clone(),
//       directory_address,
//       TaskerLink::Completed,
//       LinkTag::from(()),
//    )?;
//    return Ok(res.into());
// }


#[hdk_extern]
fn membraned_lock_task_list(list_ahb64: ActionHashB64) -> ExternResult<ActionHashB64> {
   let canEditor = am_i_editor(())?;
   if !canEditor {
      return zome_error!("Not allowed to lock task");
   }
   return lock_task_list(list_ahb64);
}