use hdk::prelude::*;
use zome_utils::call_self_cell;
use membranes_types::*;
use threshold_Vouch_integrity::*;
use threshold_Vouch_types::*;
use std::collections::BTreeMap;


#[hdk_extern]
pub fn publish_vouch_threshold(vouch_th: VouchThreshold) -> ExternResult<EntryHash> {
   debug!("publish_vouch_threshold() called: {:?}", vouch_th);
   let mth = MembraneThreshold {
      type_name:  VOUCH_THRESHOLD_NAME.to_string(),
      data: SerializedBytes::try_from(vouch_th).unwrap(),
   };
   return call_self_cell("zMembranes","publish_threshold", mth);
}


///
#[hdk_extern]
pub fn get_threshold_Vouch(eh : EntryHash) -> ExternResult<Option<VouchThreshold>> {
   let typed = zome_utils::get_typed_from_eh::<MembraneThreshold>(eh)?;
   if typed.type_name != VOUCH_THRESHOLD_NAME {
      return Ok(None);
   }
   let vt = VouchThreshold::try_from(typed.data).unwrap();
   Ok(Some(vt))
}


///
#[hdk_extern]
pub fn get_all_thresholds_Vouch(_ : ()) -> ExternResult<Vec<VouchThreshold>> {
   let thresholds: Vec<MembraneThreshold> = call_self_cell("zMembranes", "get_all_thresholds", Some(VOUCH_THRESHOLD_NAME))?;
   debug!("get_all_thresholds_Vouch() thresholds.len = {}", thresholds.len());
   let typeds = thresholds.iter().map(|th| {
      assert!(th.type_name == VOUCH_THRESHOLD_NAME);
      VouchThreshold::try_from(th.data.clone()).unwrap()
   }).collect();
   Ok(typeds)
}


/// Check if subject reached threshold.
/// Commit ThresholdReachedProof on success
/// Returns action hash of ThresholdProof on successful claim.
/// Returns None if claim failed.
#[hdk_extern]
fn claim_threshold_Vouch(input: ClaimThresholdInput) -> ExternResult<Option<ActionHash>> {
   if input.threshold.type_name != VOUCH_THRESHOLD_NAME {
      return zome_error!("Invalid type name. Claiming \"{}\" with input \"{}\"", VOUCH_THRESHOLD_NAME, input.threshold.type_name);
   }
   let th: VouchThreshold = VouchThreshold::try_from(input.threshold.data.clone())
      .expect("Corrupt threshold data");
   /// Get Threshold's by role entry
   let maybe_th_by_role: Option<MembraneRole> = call_self_cell("zMembranes", "get_role_by_name", th.by_role.clone())?;
   if maybe_th_by_role.is_none() {
      let msg = format!("Could not get Role declared in VouchThreshold.by_role: {}", th.by_role);
      return Err(wasm_error!(WasmErrorInner::Guest(msg)));
   }
   let by_role_eh = hash_entry(maybe_th_by_role.unwrap())?;
   ///  FIXME filter by role name
   let link_pairs  = zome_utils::get_typed_from_links::<Vouch>(input.subject.clone(), VouchThresholdLinkType::VouchReceived, None)?;
   /// First pass: Get vouches from unique authors
   let mut author_map: BTreeMap<AgentPubKey, (Vouch, Link)> = BTreeMap::new();
   for (vouch, link) in link_pairs {
      /// Vouch must be for this subject
      if vouch.subject != input.subject { continue }
      /// Vouch must be for the right role
      if vouch.for_role != th.for_role { continue }
      /// Get vouch's author
      let target: AnyDhtHash = link.target.clone().into_entry_hash().unwrap().into();
      let vouch_author = zome_utils::get_author(&target)?;
      author_map.insert(vouch_author, (vouch, link));
   }
   debug!("claim_threshold_Vouch() author_map.len 1 = {:?}", author_map.len());
   /// Second pass: Vouch author must have required Role
   let mut signed_ahs = Vec::new();
   author_map = author_map.into_iter().filter(|(author, (_vouch, link))| {
      let subject: AgentPubKey = author.to_owned().into();
      let payload = HasRoleInput {subject, role_eh: by_role_eh.clone()};
      let maybe_role_claim_sah: ExternResult<Option<SignedActionHashed>> = call_self_cell("zMembranes", "has_role", payload);
      if maybe_role_claim_sah.is_err() || maybe_role_claim_sah.as_ref().unwrap().is_none() { return false; }
      let role_claim_sah = maybe_role_claim_sah.unwrap().unwrap();
      /// Get Vouch's SignedActionHashed
      let target: AnyDhtHash = link.target.clone().into_entry_hash().unwrap().into();
      let maybe_vouch_sah = get(target, GetOptions::content());
      if maybe_vouch_sah.is_err() || maybe_vouch_sah.as_ref().unwrap().is_none() {
         let msg = format!("Could not get VouchReceived link's target entry {}", link.target);
         warn!(msg);
         return false;
      }
      let vouch_sah = maybe_vouch_sah.unwrap().unwrap().signed_action;
      signed_ahs.push(SignedActionHash {signature: vouch_sah.signature.clone(), ah: vouch_sah.action_address().to_owned()});
      signed_ahs.push(SignedActionHash {signature: role_claim_sah.signature.clone(), ah: role_claim_sah.action_address().to_owned()});
      return true;
   }).collect();
   debug!("claim_threshold_Vouch() author_map.len 2 = {:?}", author_map.len());
   debug!("claim_threshold_Vouch() signed_ahs = {:?}", signed_ahs);
   if author_map.len() < th.required_count {
      return Ok(None);
   }
   /// Create ThresholdReachedProof
   let proof = ThresholdReachedProof {
      threshold_eh: hash_entry(input.threshold)?,
      signed_ahs
   };
   let ah = create_entry(VouchThresholdEntry::VouchProof(proof))?;
   /// Done
   Ok(Some(ah))
}
