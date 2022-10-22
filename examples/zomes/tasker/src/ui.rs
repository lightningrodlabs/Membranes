use hdk::prelude::*;
#[allow(unused_imports)]
use tasker_model::*;

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FullTaskItem {
   pub entry: TaskItem,
   pub is_completed: bool,
}

/// Zome Function
/// get an agent's latest handle
#[hdk_extern]
pub fn get_task_item(task_ah: ActionHash) -> ExternResult<Option<FullTaskItem>> {
   /// Get TaskItem
   let maybe_pair = zome_utils::get_typed_from_ah::<TaskItem>(task_ah.clone()); // FIXME should get latest and not content
   if maybe_pair.is_err() {
      return Ok(None);
   }
   let (_eh, task_item) = maybe_pair.unwrap();
   /// Lookup "Completed" link
   let links = get_links(task_ah, TaskerLink::Completed, None)?;
   /// Done
   let full_item = FullTaskItem {
      entry: task_item,
      is_completed: links.len() > 0,
   };
   Ok(Some(full_item))
}


#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FullTaskList {
   pub title: String,
   pub is_locked: bool,
   pub items: Vec<FullTaskItem>,
}


/// Zome Function
/// get an agent's latest handle
#[hdk_extern]
pub fn get_task_list(list_ah: ActionHash) -> ExternResult<Option<FullTaskList>> {
   let maybe_pair = zome_utils::get_typed_from_ah::<TaskItem>(list_ah.clone()); // FIXME should get latest and not content
   if maybe_pair.is_err() {
      return Ok(None);
   }
   let (_eh, task_list) = maybe_pair.unwrap();
   /// Lookup "Locked" links
   let locked_links = get_links(list_ah.clone(), TaskerLink::Locked, None)?;
   /// Lookup "Item" links
   let item_links = get_links(list_ah.clone(), TaskerLink::Item, None)?;
   /// Convert to FullTaskItem
   let mut items = Vec::new();
   for item_link in item_links {
      let item_ah: ActionHash = item_link.target.into();
      let maybe_item = get_task_item(item_ah)?;
      if let Some(item) = maybe_item {
         items.push(item);
      }
   }
   /// Done
   let full_list = FullTaskList {
      title: task_list.title,
      is_locked: locked_links.len() > 0,
      items,
   };
   Ok(Some(full_list))
}


///
#[hdk_extern]
pub fn get_all_lists(_: ()) -> ExternResult<Vec<ActionHash>> {
   /// Get all TaskLists links
   let path_hash = Path::from("lists").path_entry_hash()?;
   let list_links = get_links(path_hash, TaskerLink::TaskLists, None)?;
   trace!("get_all_lists() list_links length: {:?}", list_links.len());
   /// Find each TaskList from links
   let mut full_lists = Vec::new();
   for list_link in list_links {
      let list_ah: ActionHash = list_link.target.into();
      full_lists.push(list_ah);
      // let maybe_list = get_task_list(list_ah)?;
      // if let Some(lsit) = maybe_list {
      //    full_lists.push(lsit);
      // }
   }
   trace!("get_all_lists() full_lists length: {}", full_lists.len());
   /// Done
   Ok(full_lists)
}
