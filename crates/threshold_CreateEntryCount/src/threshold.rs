use hdk::prelude::*;
use zome_utils::call_self_cell;
use membranes_types::*;
use threshold_CreateEntryCount_integrity::*;
use threshold_CreateEntryCount_types::*;
use std::collections::BTreeMap;
use crate::get_create_entries;




#[hdk_extern]
pub fn publish_CreateEntryCount_threshold(th: CreateEntryCountThreshold) -> ExternResult<EntryHash> {
   debug!("publish_CreateEntryCount_threshold() called: {:?}", th);
   let mth = MembraneThreshold {
      type_name:  CREATE_ENTRY_COUNT_THRESHOLD_NAME.to_string(),
      data: SerializedBytes::try_from(th).unwrap(),
   };
   return call_self_cell("zMembranes","publish_threshold", mth);
}


///
#[hdk_extern]
pub fn get_threshold_CreateEntryCount(eh : EntryHash) -> ExternResult<Option<CreateEntryCountThreshold>> {
   let typed = zome_utils::get_typed_from_eh::<MembraneThreshold>(eh)?;
   if typed.type_name != CREATE_ENTRY_COUNT_THRESHOLD_NAME {
      return Ok(None);
   }
   let vt = CreateEntryCountThreshold::try_from(typed.data).unwrap();
   Ok(Some(vt))
}


///
#[hdk_extern]
pub fn get_all_thresholds_CreateEntryCount(_ : ()) -> ExternResult<Vec<CreateEntryCountThreshold>> {
   let thresholds: Vec<MembraneThreshold> = call_self_cell("zMembranes", "get_all_thresholds", Some(CREATE_ENTRY_COUNT_THRESHOLD_NAME))?;
   debug!("get_all_thresholds_CreateEntryCount() thresholds.len = {}", thresholds.len());
   let typeds = thresholds.iter().map(|th| {
      assert!(th.type_name == CREATE_ENTRY_COUNT_THRESHOLD_NAME);
      CreateEntryCountThreshold::try_from(th.data.clone()).unwrap()
   }).collect();
   Ok(typeds)
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
