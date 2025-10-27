#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]

mod threshold;

#[macro_use]
extern crate zome_utils;

use hdk::prelude::*;
use membranes_types::*;
use threshold_CreateEntryCount_integrity::CreateEntryCountThresholdEntry;
use threshold_CreateEntryCount_integrity::CreateEntryCountThresholdEntry::CreateEntryCountProof;
use threshold_CreateEntryCount_types::*;
use zome_utils::call_self_cell;

/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
   debug!("*** CreateEntryCount.init() callback - START");
   let res: ExternResult<ActionHash> = call_self_cell(
      "zMembranes",
      "register_threshold_type",
      ThresholdType {
         name: CREATE_ENTRY_COUNT_THRESHOLD_NAME.to_string(),
         zome_name: zome_info()?.name.to_string(),
      },
   );
   if let Err(e) = res {
      return Ok(InitCallbackResult::Fail(format!(
         "Failed to register threshold type \"{}\": {:?}",
         CREATE_ENTRY_COUNT_THRESHOLD_NAME, e
      )));
   }
   /// Done
   debug!("*** CreateEntryCount.init() callback - DONE");
   Ok(InitCallbackResult::Pass)
}

#[hdk_extern]
fn get_create_count(input: GetCreateCountInput) -> ExternResult<usize> {
   let actions = get_create_entries(input.subject, input.entry_type)?;
   Ok(actions.len())
}

fn get_create_entries(
   subject: AgentPubKey,
   entry_type: MyAppEntryType,
) -> ExternResult<Vec<(u32, ActionHash)>> {
   let entry_type = EntryType::App(entry_type.into_typed());
   /// Ask subject directly
   // FIXME
   /// Ask subject's neighbors
   /// FIXME: get_agent_activity doesnt work
   // let query = ChainQueryFilter::default()
   //    .include_entries(false)
   //    .action_type(ActionType::Create)
   //    .entry_type(entry_type);
   //let activity = get_agent_activity(subject, query, ActivityRequest::Full)?;
   //let actions = activity.valid_activity.clone();
   /// With must_get_agent_activity
   let filter: ChainFilter<ActionHash> = ChainFilter {
      chain_top: call_info()?.as_at.0,
      include_cached_entries: true,
      limit_conditions: LimitConditions::ToGenesis,
   };
   let actions = must_get_agent_activity(subject, filter)?;
   let actions: Vec<(u32, ActionHash)> = actions.into_iter().filter_map(|activity| {
      let Action::Create(create) = activity.action.action().clone() else { return None };
      if create.entry_type != entry_type {return None};
      Some((create.action_seq, activity.action.action_address().clone()))
   }).collect();
   debug!("get_created_entries() valid actions found: {} | {:?}", actions.len(), actions);
   Ok(actions)
}

//--------------------------------------------------------------------------------------------------

use hdk::prelude::*;


#[hdk_extern]
fn get_zome_info(_:()) -> ExternResult<ZomeInfo> {
   return zome_info();
}


#[hdk_extern]
fn get_dna_info(_:()) -> ExternResult<DnaInfo> {
   return dna_info();
}

//--------------------------------------------------------------------------------------------------