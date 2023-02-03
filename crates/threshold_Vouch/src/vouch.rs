
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