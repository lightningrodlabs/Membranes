use hdk::prelude::*;
use hdk::prelude::holo_hash::EntryHashB64;
use membranes_integrity::MembranesLinkType;
use membranes_types::*;
use crate::anchors;



///
#[hdk_extern]
pub fn dna_info_hack(_: ()) -> ExternResult<Vec<ZomeName>> {
   let result = dna_info()?;
   Ok(result.zome_names)
}


//
#[hdk_extern]
pub fn echo_app_entry_def(entry_type: AppEntryDef) -> ExternResult<()> {
   debug!("echo_app_entry_def() called: {:?}", entry_type);
   Ok(())
}


///
#[hdk_extern]
pub fn get_vouch_author(typed: Vouch) -> ExternResult<AgentPubKey> {
   let eh = hash_entry(typed)?;
   return zome_utils::get_author(&eh.into());
}