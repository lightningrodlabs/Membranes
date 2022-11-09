use hdk::prelude::*;
#[allow(unused_imports)]
use tasker_model::*;
use hdk::prelude::holo_hash::ActionHashB64;
//use crate::holo_hash::AgentPubKeyB64;

// #[derive(Serialize, Deserialize, Debug)]
// #[serde(rename_all = "camelCase")]
// pub struct FullTaskItem {
//    pub entry: TaskItem,
//    pub is_completed: bool,
// }

/// Zome Function
/// get an agent's latest handle
#[hdk_extern]
pub fn get_task_item(eh: EntryHash) -> ExternResult<Option<(TaskItem, bool)>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   //debug!("get_task_item() called! - {}", eh);
   /// Get TaskItem
   let Ok(task_item) = zome_utils::get_typed_from_eh::<TaskItem>(eh.clone().into()) // FIXME should get latest and not content
   else {
      return Ok(None);
   };
   /// Lookup "Completed" link
   let links = get_links(eh, TaskerLinkType::Completed, None)?;
   //debug!("get_task_item() Completed.links.len = {}", links.len());
   /// Done
   Ok(Some((task_item, links.len() > 0)))
}


///
#[hdk_extern]
pub fn get_list_items(list_eh: EntryHash) -> ExternResult<Vec<(EntryHash, TaskItem, bool)>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   //debug!("get_list_items() called !");
   //let list: TaskList = zome_utils::get_typed_from_eh(list_eh)?;
   let item_links = get_links(list_eh.clone(), TaskerLinkType::Item, None)?;
   //debug!("item_links() item_links.len = {}", item_links.len());
   let mut result = Vec::new();
   for link in item_links.into_iter() {
      let item_eh: EntryHash = link.target.into();
      let Some((item, is_complete)) = get_task_item(item_eh.clone())?
      else {
         continue;
      };
      result.push((item_eh.clone(), item, is_complete));
   }
   //debug!("item_links() result = {:?}", result);
   Ok(result)
}


// #[derive(Serialize, Deserialize, Debug)]
// #[serde(rename_all = "camelCase")]
// pub struct FullTaskList {
//    pub title: String,
//    pub is_locked: bool,
//    pub items: Vec<(ActionHashB64, FullTaskItem)>,
// }


// /// Zome Function
// /// get an agent's latest handle
// #[hdk_extern]
// pub fn get_task_list(list_ah: ActionHashB64) -> ExternResult<Option<FullTaskList>> {
//    debug!("get_task_list(): '{}'", list_ah);
//    let maybe_pair = zome_utils::get_typed_from_ah::<TaskList>(list_ah.clone().into()); // FIXME should get latest and not content
//    debug!("get_task_list() result = '{:?}'", maybe_pair);
//    if maybe_pair.is_err() {
//       return Ok(None);
//    }
//    let (_eh, task_list) = maybe_pair.unwrap();
//    /// Lookup "Locked" links
//    let locked_links = get_links(list_ah.clone(), TaskerLinkType::Locked, None)?;
//    /// Lookup "Item" links
//    let item_links = get_links(list_ah.clone(), TaskerLinkType::Item, None)?;
//    /// Convert to FullTaskItem
//    let mut items = Vec::new();
//    for item_link in item_links {
//       let item_ah: ActionHash = item_link.target.into();
//       let item_ahB64: ActionHashB64 = item_ah.into();
//       let maybe_item = get_task_item(item_ahB64.clone())?;
//       if let Some(item) = maybe_item {
//          items.push((item_ahB64, item));
//       }
//    }
//    /// Done
//    let full_list = FullTaskList {
//       title: task_list.title,
//       is_locked: locked_links.len() > 0,
//       items,
//    };
//    Ok(Some(full_list))
// }


///
#[hdk_extern]
pub fn get_all_lists(_: ()) -> ExternResult<Vec<(EntryHash, TaskList)>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   debug!("get_all_lists() called !");
   /// Get all TaskLists links
   let anchor = Path::from("lists").path_entry_hash()?;
   let links = get_links(anchor.clone(), TaskerLinkType::TaskLists, None);
   debug!("get_all_lists() {:?}", links);
   let link_pairs= zome_utils::get_typed_from_links::<TaskList>(anchor, TaskerLinkType::TaskLists, None)?;
   debug!("get_all_lists() link_pairs.len() = {:?}", link_pairs.len());
   let list_pairs: Vec<(EntryHash, TaskList)> = link_pairs.into_iter().map(|(list, link)| {
      let list_eh: EntryHash = link.target.into();
      (list_eh, list)
   }).collect();
   /// Done
   Ok(list_pairs)
}
