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
pub fn echo_app_entry_type(entry_type: AppEntryType) -> ExternResult<()> {
   debug!("echo_app_entry_type() called: {:?}", entry_type);
   Ok(())
}
