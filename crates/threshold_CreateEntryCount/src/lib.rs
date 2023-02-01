#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]


#[macro_use]
extern crate zome_utils;


use hdk::prelude::*;
use threshold_CreateEntryCount_types::*;
use membranes_types::*;


#[hdk_extern]
fn get_create_count(input: GetCreateCountInput) -> ExternResult<usize> {
   let actions = get_create_entries(input.subject, input.entry_type)?;
   Ok(actions.len())
}


fn get_create_entries(subject: AgentPubKey, entry_type: MyAppEntryType) -> ExternResult<Vec<(u32, ActionHash)>> {
   /// Ask subject directly
   // FIXME
   /// Ask subject's neighbours
   let query = ChainQueryFilter::default()
      .include_entries(false)
      .action_type(ActionType::Create)
      .entry_type(EntryType::App(entry_type.into_typed()));
   let activity = get_agent_activity(subject, query, ActivityRequest::Full)?;
   let actions = activity.valid_activity;
   //debug!("get_created_entries() valid actions found: {:?}", actions);
   Ok(actions)
}


/// Returns None if claim failed
fn claim_createEntryCountThreshold(subject: AgentPubKey, th: CreateEntryCountThreshold) -> ExternResult<Option<Vec<SignedActionHashed>>> {
   let actions = get_create_entries(subject, th.entry_type)?;
   if actions.len() < th.required_count {
      return Ok(None);
   }
   /// Convert actions to signed actions (-_-)
   let mut signed_entries = Vec::new();
   for (_index, ah) in actions {
      let record = get(ah, GetOptions::content())?
         .expect("Should be able to get the action found in agent activity");
      signed_entries.push(record.signed_action)
   }
   /// Done
   Ok(Some(signed_entries))
}
