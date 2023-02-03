#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]

mod validate;
mod zome_properties;

use hdi::prelude::*;
use membranes_types::*;

pub use zome_properties::*;


#[hdk_entry_defs]
#[unit_enum(ProgenitorThresholdEntryTypes)]
pub enum ProgenitorThresholdEntry {
   #[entry_def(required_validations = 3, visibility = "public")]
   ProgenitorProof(ThresholdReachedProof),
}
