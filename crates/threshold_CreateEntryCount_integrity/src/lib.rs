#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]

mod validate;

use hdi::prelude::*;
use membranes_types::*;


#[hdk_entry_defs]
#[unit_enum(MembranesEntryTypes)]
pub enum CreateEntryCountThresholdEntry {
   #[entry_def(required_validations = 3, visibility = "public")]
   CreateEntryCountProof(ThresholdReachedProof),
   // #[entry_def(required_validations = 3, visibility = "public")]
   // Vouch(Vouch),
}
