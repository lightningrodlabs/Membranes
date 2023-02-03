#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]

mod validate;

use hdi::prelude::*;
use membranes_types::*;
use threshold_Vouch_types::*;

#[hdk_entry_defs]
#[unit_enum(VouchThresholdEntryTypes)]
pub enum VouchThresholdEntry {
   #[entry_def(required_validations = 3, visibility = "public")]
   VouchProof(ThresholdReachedProof),
   #[entry_def(required_validations = 3, visibility = "public")]
   Vouch(Vouch),
}


/// Get EntryDefIndex from a unit_enum
pub(crate) fn get_variant_index<T: UnitEnum>(unknown: T::Unit) -> ExternResult<u8> {
   let mut i = 0;
   for variant in T::unit_iter() {
      //debug!("get_index() variant = {:?}", variant);
      if variant == unknown {
         return Ok(i);
      }
      i += 1;
   }
   return Err(wasm_error!(WasmErrorInner::Guest("Unknown variant".to_string())));
}

/// List of all Link kinds handled by this Zome
#[hdk_link_types]
pub enum VouchThresholdLinkType {
   VouchCreated,
   VouchEmitted,
   VouchReceived,
}
