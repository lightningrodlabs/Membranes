use hdk::prelude::*;
use hdk::prelude::holo_hash::{ActionHashB64};
use tasker_model::*;


#[hdk_extern]
fn create_task_list(title: String) -> ExternResult<ActionHashB64> {
   // Must be at least editor

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
