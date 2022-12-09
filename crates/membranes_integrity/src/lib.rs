#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

mod validate;
pub(crate) mod validate_app_entry;
pub mod zome_properties;

pub use zome_properties::*;

use hdi::prelude::*;
use membranes_types::*;

#[hdk_entry_defs]
#[unit_enum(MembranesEntryTypes)]
pub enum MembranesEntry {
   #[entry_def(required_validations = 3, visibility = "public")]
   Threshold(MembraneThreshold),
   #[entry_def(required_validations = 3, visibility = "public")]
   Membrane(Membrane),
   #[entry_def(required_validations = 3, visibility = "public")]
   MembraneCrossedClaim(MembraneCrossedClaim),
   #[entry_def(required_validations = 3, visibility = "public")]
   Role(MembraneRole),
   #[entry_def(required_validations = 3, visibility = "public")]
   RoleClaim(RoleClaim),
   #[entry_def(required_validations = 3, visibility = "public")]
   Vouch(Vouch),
}


/// Get EntryDefIndex from a unit_enum
pub fn get_index(wtf: MembranesEntryTypes) -> ExternResult<u8> {
   let mut i = 0;
   for variant in MembranesEntry::unit_iter() {
      debug!("get_index() variant = {:?}", variant);
      if variant == wtf {
         return Ok(i);
      }
      i += 1;
   }
   return Err(wasm_error!(WasmErrorInner::Guest("Unknown variant".to_string())));
}


/// List of all Link kinds handled by this Zome
#[hdk_link_types]
pub enum MembranesLinkType {
   VouchCreated,
   VouchEmitted,
   VouchReceived,
   MembranePassport,
   RolePassport,
   Role,
   Membrane,
   Threshold,
}