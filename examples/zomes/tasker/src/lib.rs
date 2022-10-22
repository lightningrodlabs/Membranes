#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

mod callbacks;
mod ui;

use hdk::prelude::*;
use tasker_model::*;


#[hdk_extern]
fn create_task_list(title: String) -> ExternResult<ActionHash> {
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
   return Ok(ah);
}


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskItemInput {
   pub title: String,
   pub assignee: AgentPubKey,
   pub list_ah: ActionHash
}

#[hdk_extern]
fn create_task_item(input: CreateTaskItemInput) -> ExternResult<ActionHash> {
   let taskItem = TaskItem {title: input.title, assignee: input.assignee, list_ah: input.list_ah.clone() };
   let ah = create_entry(TaskerEntry::TaskItem(taskItem))?;
   let _ = create_link(
      input.list_ah,
      ah.clone(),
      TaskerLink::Item,
      LinkTag::from(()),
   )?;
   return Ok(ah);
}


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReassignTaskInput {
   pub task_ah: ActionHash,
   pub assignee: AgentPubKey,
}

#[hdk_extern]
fn reassign_task(input: ReassignTaskInput) -> ExternResult<ActionHash> {
   let (_eh, item) = zome_utils::get_typed_from_ah::<TaskItem>(input.task_ah.clone())?; // FIXME should get latest and not content
   let newItem = TaskItem {title: item.title, assignee: input.assignee, list_ah: item.list_ah};
   let res = update_entry(input.task_ah, TaskerEntry::TaskItem(newItem))?;
   return Ok(res);
}


#[hdk_extern]
fn complete_task(task_ah: ActionHash) -> ExternResult<ActionHash> {
   let directory_address = Path::from("completed")
      .path_entry_hash()
      .expect("completed path should hash");
   let res = create_link(
      task_ah.clone(),
      directory_address,
      TaskerLink::Completed,
      LinkTag::from(()),
   )?;
   return Ok(res);
}


#[hdk_extern]
fn lock_task_list(list_ah: ActionHash) -> ExternResult<ActionHash> {
   let directory_address = Path::from("locked")
      .path_entry_hash()
      .expect("completed path should hash");
   let res = create_link(
      list_ah.clone(),
      directory_address,
      TaskerLink::Locked,
      LinkTag::from(()),
   )?;
   return Ok(res);
}