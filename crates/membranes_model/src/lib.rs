#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

use hdi::prelude::*;

pub mod constants;
pub mod privilege;
pub mod entries_threshold;
pub mod links;
pub mod entries;


pub use privilege::*;
pub use entries::*;
pub use entries_threshold::*;
pub use links::*;


#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
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
   // #[entry_def(required_validations = 3, visibility = "public")]
   // VouchThreshold(VouchThreshold),
   // #[entry_def(required_validations = 3, visibility = "public")]
   // CreateEntryCountThreshold(CreateEntryCountThreshold),
   #[entry_def(required_validations = 3, visibility = "public")]
   Vouch(Vouch),
}

