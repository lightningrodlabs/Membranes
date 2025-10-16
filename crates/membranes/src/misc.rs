use crate::anchors;
use hdk::prelude::holo_hash::EntryHashB64;
use hdk::prelude::*;
use membranes_integrity::MembranesLinkType;
use membranes_types::*;

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
