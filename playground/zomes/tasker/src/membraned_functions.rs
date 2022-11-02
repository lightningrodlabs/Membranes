use hdk::prelude::*;
use hdk::prelude::holo_hash::{ActionHashB64};
use membranes_types::{MembraneInput, ClaimRoleInput, HasRoleInput, Membrane, MembraneRole};
use tasker_model::*;
use crate::basic_functions::lock_task_list;
use crate::call_membranes_zome;
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


pub fn am_i_editor() -> ExternResult<bool> {
   let meB64: AgentPubKeyB64 = agent_info()?.agent_initial_pubkey.into();
   let maybe_pair: Option<(EntryHashB64, MembraneRole)> = call_membranes_zome("get_role_with_name", "editor")?;
   //debug!("am_i_editor() maybe_pair: {:?}", maybe_pair);
   if maybe_pair.is_none() {
      return zome_error!("'editor' role not found");
   }
   let maybe_signed_role_claim: Option<SignedActionHashed> = call_membranes_zome("has_role", HasRoleInput {subject: meB64, role_eh: maybe_pair.unwrap().0})?;
   //debug!("am_i_editor() maybe_signed_role_claim: {:?}", maybe_signed_role_claim);
   Ok(maybe_signed_role_claim.is_some())
}


#[hdk_extern]
fn membraned_lock_task_list(list_ahb64: ActionHashB64) -> ExternResult<ActionHashB64> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   let canEditor = am_i_editor()?;
   if !canEditor {
      return zome_error!("Not allowed to lock task");
   }
   let ah =  lock_task_list(list_ahb64)?;
   Ok(ah)
}