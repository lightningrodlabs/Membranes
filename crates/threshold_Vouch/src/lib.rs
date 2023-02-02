#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]


#[macro_use]
extern crate zome_utils;


use std::collections::BTreeMap;
use hdk::prelude::*;
//use membranes::*;
use membranes_types::*;
use threshold_Vouch_types::*;
use threshold_Vouch_integrity::*;
use zome_utils::call_self_cell;
//use crate::anchors::*;


///
#[hdk_extern]
pub fn get_all_role_names(_ : ()) -> ExternResult<Vec<String>> {
   let result_pairs: Vec<(EntryHash, MembraneRole)> = call_self_cell("zMembranes", "get_all_roles_details", ())?;
   debug!("role details found: {}", result_pairs.len());
   let mut result = Vec::new();
   for (_eh, role) in result_pairs {
      result.push(role.name)
   }
   Ok(result)
}


/// Proof of vouchThreshold is SAH of Vouchs and RoleClaims by Vouchers.
/// Returns None if claim failed.
fn claim_vouchThreshold(subject: AgentPubKey, th: VouchThreshold) -> ExternResult<Option<Vec<SignedActionHashed>>> {
   /// Get Threshold's by role entry
   let maybe_th_by_role: Option<MembraneRole> = call_self_cell("zMembranes", "get_role_by_name", th.by_role.clone())?;
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
      let payload = HasRoleInput {subject, role_eh: by_role_eh.clone()};
      let maybe_role_claim: ExternResult<Option<SignedActionHashed>> = call_self_cell("zMembranes","has_role", payload);
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




///
#[hdk_extern]
pub fn get_vouch_author(typed: Vouch) -> ExternResult<AgentPubKey> {
   let eh = hash_entry(typed)?;
   return zome_utils::get_author(&eh.into());
}


///
#[hdk_extern]
pub fn get_vouch(eh : EntryHash) -> ExternResult<Option<Vouch>> {
   let maybe_typed = zome_utils::get_typed_from_eh::<Vouch>(eh);
   match maybe_typed {
      Ok(typed) => Ok(Some(typed)),
      Err(_e) => Ok(None),
   }
}


///
#[hdk_extern]
pub fn publish_vouch(vouch: Vouch) -> ExternResult<EntryHash> {
   let maybe_role: Option<MembraneRole> = call_self_cell("zMembranes", "get_role_by_name", vouch.for_role.clone())?;
   if maybe_role.is_none() {
      let msg = format!("Could not get Role declared in Vouch: {}", vouch.for_role);
      return Err(wasm_error!(WasmErrorInner::Guest(msg)));
   }
   let role_name_bytes = maybe_role.unwrap().name.into_bytes();
   let _ah = create_entry(VouchThresholdEntry::Vouch(vouch.clone()))?;
   let vouch_eh = hash_entry(vouch.clone())?;
   let author = agent_info()?.agent_initial_pubkey;
   let _lah = create_link(vouch.subject.clone(), vouch_eh.clone(), VouchThresholdLinkType::VouchReceived, LinkTag::from(role_name_bytes.clone()))?;
   let _lah = create_link(author, vouch_eh.clone(), VouchThresholdLinkType::VouchEmitted, LinkTag::from(role_name_bytes))?;
   /// Link from role name
   let role_name_eh = Path::from(vouch.for_role.clone()).path_entry_hash()?;
   create_link(role_name_eh, vouch_eh.clone(), VouchThresholdLinkType::VouchCreated, LinkTag::from(vouch.subject.as_ref().to_vec()))?;
   /// Done
   Ok(vouch_eh)
}


///
#[hdk_extern]
pub fn get_my_emitted_vouches(maybe_role: Option<String>) -> ExternResult<Vec<EntryHash>> {
   let author = agent_info()?.agent_initial_pubkey;
   let maybe_tag = match maybe_role {
      Some(name) => Some(LinkTag::from(name.into_bytes())),
      None => None,
   };
   let result = get_links(author, VouchThresholdLinkType
   ::VouchEmitted, maybe_tag)?;
   let res= result.iter().map(|link| {
      let eh: EntryHash =link.target.clone().into();
      eh
   }).collect();
   Ok(res)
}


///
#[hdk_extern]
pub fn get_my_received_vouches(maybe_role: Option<String>) -> ExternResult<Vec<(EntryHash, AgentPubKey)>> {
   let author = agent_info()?.agent_initial_pubkey;
   let maybe_tag = match maybe_role {
      Some(name) => Some(LinkTag::from(name.into_bytes())),
      None => None,
   };
   let result = get_links(author, VouchThresholdLinkType::VouchReceived, maybe_tag)?;
   let res = result.iter().map(|link| {
      let eh: EntryHash =link.target.clone().into();
      let author = zome_utils::get_author(&eh.clone().into()).expect("must find Vouch author");
      (eh, author)
   }).collect();
   Ok(res)
}