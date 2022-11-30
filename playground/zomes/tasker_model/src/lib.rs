#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]

mod validate;

use hdi::prelude::*;

/// List of all Entry types handled by this Zome
#[hdk_entry_defs]
#[unit_enum(TaskerEntryTypes)]
#[derive(Clone, PartialEq)]
pub enum TaskerEntry {
   #[entry_def(required_validations = 3, visibility = "public")]
   TaskList(TaskList),
   #[entry_def(required_validations = 3, visibility = "public")]
   TaskItem(TaskItem),
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct TaskList {
   pub title: String,
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TaskItem {
   pub title: String,
   pub assignee: AgentPubKey,
   pub list_eh: EntryHash, // to TaskList
}


/// List of all Link types handled by this Zome
#[hdk_link_types]
#[derive(Serialize, Deserialize)]
pub enum TaskerLinkType {
   Default,
   Path,
   TaskLists,
   Locked,  /// RoleClaim EntryHash in Tag
   Completed,
   Item,
}