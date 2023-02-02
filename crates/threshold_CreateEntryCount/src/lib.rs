#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]


#[macro_use]
extern crate zome_utils;


use hdk::prelude::*;
use zome_utils::call_self_cell;
use threshold_CreateEntryCount_types::*;
use membranes_types::*;
use threshold_CreateEntryCount_integrity::CreateEntryCountThresholdEntry;
use threshold_CreateEntryCount_integrity::CreateEntryCountThresholdEntry::CreateEntryCountProof;



/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
   debug!("*** Vouch.init() callback - START");
   let res: ExternResult<ActionHash> = call_self_cell(
      "zMembranes",
      "register_threshold_type",
      ThresholdType { name: CREATE_ENTRY_COUNT_THRESHOLD_NAME.to_string(), zome_name: zome_info()?.name.to_string()},
   );
   if let Err(e) = res {
      return Ok(InitCallbackResult::Fail(format!("Failed to register threshold type \"{}\": {:?}", CREATE_ENTRY_COUNT_THRESHOLD_NAME, e)));
   }
   /// Done
   debug!("*** Vouch.init() callback - DONE");
   Ok(InitCallbackResult::Pass)
}


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


/// Check if subject reached threshold.
/// Commit ThresholdReachedProof on success
/// Returns action hash of ThresholdProof on successful claim.
/// Returns None if claim failed.
#[hdk_extern]
fn claim_threshold_CreateEntryCount(input: ClaimThresholdInput) -> ExternResult<Option<ActionHash>> {
   if input.threshold.type_name != CREATE_ENTRY_COUNT_THRESHOLD_NAME {
      return zome_error!("Invalid type name. Claiming \"{}\" with input \"{}\"", CREATE_ENTRY_COUNT_THRESHOLD_NAME, input.threshold.type_name);
   }
   let cec_th: CreateEntryCountThreshold = CreateEntryCountThreshold::try_from(input.threshold.data.clone())
      .expect("Corrupt threshold data");
   let actions = get_create_entries(input.subject, cec_th.entry_type)?;
   if actions.len() < cec_th.required_count {
      return Ok(None);
   }
   /// Convert actions to signed actions (-_-)
   let mut signed_actions = Vec::new();
   for (_index, ah) in actions {
      let record = get(ah, GetOptions::content())?
         .expect("Should be able to get the action found in agent activity");
      signed_actions.push(record.signed_action)
   }
   /// Create ThresholdReachedProof
   let proof = ThresholdReachedProof {
      threshold_eh: hash_entry(input.threshold)?,
      signed_actions
   };
   let ah = create_entry(CreateEntryCountThresholdEntry::CreateEntryCountProof(proof))?;
   /// Done
   Ok(Some(ah))
}
