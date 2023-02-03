use hdk::prelude::*;
//use zome_utils::call_self_cell;
use membranes_types::*;
use threshold_Progenitor_integrity::*;
use threshold_Progenitor_types::*;


// ///
// #[hdk_extern]
// pub fn get_threshold_Progenitor(eh : EntryHash) -> ExternResult<Option<CreateEntryCountThreshold>> {
//    let typed = zome_utils::get_typed_from_eh::<MembraneThreshold>(eh)?;
//    if typed.type_name != PROGENITOR_THRESHOLD_NAME {
//       return Ok(None);
//    }
//    let vt = ProgenitorThreshold::try_from(typed.data).unwrap();
//    Ok(Some(vt))
// }


// ///
// #[hdk_extern]
// pub fn get_all_thresholds_Progenitor(_ : ()) -> ExternResult<Vec<CreateEntryCountThreshold>> {
//    let thresholds: Vec<MembraneThreshold> = call_self_cell("zMembranes", "get_all_thresholds", Some(PROGENITOR_THRESHOLD_NAME))?;
//    debug!("get_all_thresholds_Progenitor() thresholds.len = {}", thresholds.len());
//    let typeds = thresholds.iter().map(|th| {
//       assert!(th.type_name == PROGENITOR_THRESHOLD_NAME);
//       CreateEntryCountThreshold::try_from(th.data.clone()).unwrap()
//    }).collect();
//    Ok(typeds)
// }


/// Check if subject reached threshold.
/// Commit ThresholdReachedProof on success
/// Returns action hash of ThresholdProof on successful claim.
/// Returns None if claim failed.
#[hdk_extern]
fn claim_threshold_Progenitor(input: ClaimThresholdInput) -> ExternResult<Option<ActionHash>> {
   debug!("claim_threshold_Progenitor()");
   if input.threshold.type_name != PROGENITOR_THRESHOLD_NAME {
      return zome_error!("Invalid threshold type name. Claiming \"{}\" with input \"{}\"", PROGENITOR_THRESHOLD_NAME, input.threshold.type_name);
   }
   let succeeded = is_progenitor(input.subject)?;
   if !succeeded {
      return Ok(None);
   }
   /// Create ThresholdReachedProof
   let proof = ThresholdReachedProof {
      threshold_eh: hash_entry(input.threshold)?,
      signed_ahs: Vec::new(),
   };
   let ah = create_entry(ProgenitorThresholdEntry::ProgenitorProof(proof))?;
   /// Done
   Ok(Some(ah))
}

