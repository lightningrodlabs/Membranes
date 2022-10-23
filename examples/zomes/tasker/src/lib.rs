#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

mod callbacks;
mod ui;

use hdk::prelude::*;
use tasker_model::*;
use crate::holo_hash::ActionHashB64;
use crate::holo_hash::AgentPubKeyB64;


#[hdk_extern]
fn create_task_list(title: String) -> ExternResult<ActionHashB64> {
   let ah = create_entry(TaskerEntry::TaskList(TaskList {title}))?;
   let directory_address = Path::from("lists")
      .path_entry_hash()
      .expect("TaskLists Path should hash");
   let _ = create_link(
      directory_address,
      ah.clone(),
      TaskerLink::TaskLists,
      LinkTag::from(()),
   )?;
   return Ok(ah.into());
}


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskItemInput {
   pub title: String,
   pub assignee: AgentPubKeyB64,
   pub list_ah: ActionHashB64
}

#[hdk_extern]
fn create_task_item(input: CreateTaskItemInput) -> ExternResult<ActionHashB64> {
   let taskItem = TaskItem {title: input.title, assignee: input.assignee, list_ah: input.list_ah.clone() };
   let ah = create_entry(TaskerEntry::TaskItem(taskItem))?;
   let _ = create_link(
      input.list_ah,
      ah.clone(),
      TaskerLink::Item,
      LinkTag::from(()),
   )?;
   return Ok(ah.into());
}


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReassignTaskInput {
   pub task_ah: ActionHashB64,
   pub assignee: AgentPubKeyB64,
}

#[hdk_extern]
fn reassign_task(input: ReassignTaskInput) -> ExternResult<ActionHashB64> {
   let (_eh, item) = zome_utils::get_typed_from_ah::<TaskItem>(input.task_ah.clone().into())?; // FIXME should get latest and not content
   let newItem = TaskItem {title: item.title, assignee: input.assignee, list_ah: item.list_ah};
   let res = update_entry(input.task_ah.into(), TaskerEntry::TaskItem(newItem))?;
   return Ok(res.into());
}


#[hdk_extern]
fn complete_task(task_ah: ActionHashB64) -> ExternResult<ActionHashB64> {
   let directory_address = Path::from("completed")
      .path_entry_hash()
      .expect("completed path should hash");
   let res = create_link(
      task_ah.clone(),
      directory_address,
      TaskerLink::Completed,
      LinkTag::from(()),
   )?;
   return Ok(res.into());
}


#[hdk_extern]
fn lock_task_list(list_ahb64: ActionHashB64) -> ExternResult<ActionHashB64> {
   let directory_address = Path::from("locked")
      .path_entry_hash()
      .expect("completed path should hash");
      let list_ah: ActionHash = list_ahb64.into();
   let res = create_link(
      list_ah.clone(),
      directory_address,
      TaskerLink::Locked,
      LinkTag::from(()),
   )?;
   return Ok(res.into());
}