#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]


#[macro_use]
extern crate zome_utils;


use hdk::prelude::*;
//use membranes::*;
use membranes_types::*;
use threshold_Vouch_types::*;
use threshold_Vouch_integrity::*;
use std::collections::BTreeMap;


/// Proof of vouchThreshold is SAH of Vouchs and RoleClaims by Vouchers.
/// Returns None if claim failed.
fn claim_vouchThreshold(subject: AgentPubKey, th: VouchThreshold) -> ExternResult<Option<Vec<SignedActionHashed>>> {
   /// Get Threshold's by role entry
      // Fixme do a external call to membranes zome: get_role_by_name(th.by_role.clone())?;
   let maybe_th_by_role: Option<MembraneRole> = None;
   if maybe_th_by_role.is_none() {
      let msg = format!("Could not get Role declared in VouchThreshold.by_role: {}", th.by_role);
      return Err(wasm_error!(WasmErrorInner::Guest(msg)));
   }
   let by_role_eh = hash_entry(maybe_th_by_role.unwrap())?;
   ///  FIXME filter by role name
   let link_pairs  = zome_utils::get_typed_from_links::<Vouch>(subject.clone(), VouchThresholdLinkType::VouchReceived, None)?;
   /// First pass: Get vouches from unique authors
   let mut author_map: BTreeMap<AgentPubKey, (Vouch, Link)> = BTreeMap::new();
   for (vouch, link) in link_pairs {
      /// Vouch must be for this subject
      if vouch.subject != subject { continue }
      /// Vouch must be for the right role
      if vouch.for_role != th.for_role { continue }
      /// Get vouch's author
      let target: holo_hash::AnyDhtHash = link.target.clone().into_entry_hash().unwrap().into();
      let vouch_author = zome_utils::get_author(&target)?;
      author_map.insert(vouch_author, (vouch, link));
   }
   debug!("claim_vouchThreshold() author_map.len 1 = {:?}", author_map.len());
   /// Second pass: Vouch author must have required Role
   let mut signed_actions = Vec::new();
   author_map = author_map.into_iter().filter(|(author, (_vouch, link))| {
      let subject: AgentPubKey = author.to_owned().into();
      // Fixme do a external call to membranes zome: has_role(HasRoleInput{subject, role_eh: by_role_eh.clone()});
      let maybe_role_claim: ExternResult<Option<SignedActionHashed>> = Ok(None);
      if maybe_role_claim.is_err() || maybe_role_claim.as_ref().unwrap().is_none() { return false; }
      let role_claim = maybe_role_claim.unwrap().unwrap();
      /// Get Vouch's SignedActionHashed
      let target: holo_hash::AnyDhtHash = link.target.clone().into_entry_hash().unwrap().into();
      let maybe_vouch_sah = get(target, GetOptions::content());
      if maybe_vouch_sah.is_err() || maybe_vouch_sah.as_ref().unwrap().is_none() {
         let msg = format!("Could not get VouchReceived link's target entry {}", link.target);
         warn!(msg);
         return false;
      }
      signed_actions.push(maybe_vouch_sah.unwrap().unwrap().signed_action);
      signed_actions.push(role_claim);
      return true;
   }).collect();
   debug!("claim_vouchThreshold() author_map.len 2 = {:?}", author_map.len());
   debug!("claim_vouchThreshold() signed_actions = {:?}", signed_actions);
   if author_map.len() < th.required_count {
      return Ok(None);
   }
   /// Done
   Ok(Some(signed_actions))
}


