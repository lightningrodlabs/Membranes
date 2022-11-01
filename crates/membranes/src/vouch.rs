use hdk::prelude::*;
use membranes_integrity::*;
use membranes_types::*;
use crate::anchors::*;


///
#[hdk_extern]
pub fn publish_vouch(vouch: Vouch) -> ExternResult<EntryHash> {
   let maybe_role = get_role_by_name(vouch.for_role.clone())?;
   if maybe_role.is_none() {
      let msg = format!("Could not get Role declared in Vouch: {}", vouch.for_role);
      return Err(wasm_error!(WasmErrorInner::Guest(msg)));
   }
   let role_name_bytes = maybe_role.unwrap().name.into_bytes();
   let _ah = create_entry(MembranesEntry::Vouch(vouch.clone()))?;
   let vouch_eh = hash_entry(vouch.clone())?;
   let author = agent_info()?.agent_initial_pubkey;
   let _lah = create_link(vouch.subject.clone(), vouch_eh.clone(), MembranesLinkType::VouchReceived, LinkTag::from(role_name_bytes.clone()))?;
   let _lah = create_link(author, vouch_eh.clone(), MembranesLinkType::VouchEmitted, LinkTag::from(role_name_bytes))?;
   /// Link from role name
   let role_name_eh = Path::from(vouch.for_role.clone()).path_entry_hash()?;
   create_link(role_name_eh, vouch_eh.clone(), MembranesLinkType::Vouch, LinkTag::from(vouch.subject.as_ref().to_vec()))?;
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
   let result = get_links(author, MembranesLinkType::VouchEmitted, maybe_tag)?;
   let res = result.iter().map(|link| {
      let eh: EntryHash =link.target.clone().into();
      eh
   }).collect();
   Ok(res)
}



///
#[hdk_extern]
pub fn get_my_received_vouches(maybe_role: Option<String>) -> ExternResult<Vec<EntryHash>> {
   let author = agent_info()?.agent_initial_pubkey;
   let maybe_tag = match maybe_role {
      Some(name) => Some(LinkTag::from(name.into_bytes())),
      None => None,
   };
   let result = get_links(author, MembranesLinkType::VouchReceived, maybe_tag)?;
   let res = result.iter().map(|link| {
      let eh: EntryHash =link.target.clone().into();
      eh
   }).collect();
   Ok(res)
}