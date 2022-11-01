#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

use hdi::prelude::*;

use membranes_types::*;

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

/// List of all Link kinds handled by this Zome
#[hdk_link_types]
pub enum MembranesLinkType {
   Vouch,
   VouchEmitted,
   VouchReceived,
   MembranePassport,
   RolePassport,
   Role,
   Membrane,
   Threshold,
}