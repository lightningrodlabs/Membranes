#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

use hdi::prelude::*;

pub mod constants;
pub mod privilege;
pub mod threshold;
pub mod links;

pub use privilege::*;
pub use threshold::*;
pub use links::*;

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum MembranesEntry {
   #[entry_def(required_validations = 3, visibility = "public")]
   MembraneCrossingProof(MembraneCrossingProof),
   #[entry_def(required_validations = 3, visibility = "public")]
   Role(Role),
   #[entry_def(required_validations = 3, visibility = "public")]
   Membrane(Membrane),
   #[entry_def(required_validations = 3, visibility = "public")]
   MembraneThreshold(MembraneThreshold),
   // #[entry_def(required_validations = 3, visibility = "public")]
   // VouchThreshold(VouchThreshold),
   // #[entry_def(required_validations = 3, visibility = "public")]
   // CreateEntryCountThreshold(CreateEntryCountThreshold),
   #[entry_def(required_validations = 3, visibility = "public")]
   Vouch(Vouch),
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MembraneCrossingProof {
   pub proof: Vec<SignedActionHashed>, // All the hashed action and the signature that signed it
   pub threshold_index: u32,
   pub role_eh: EntryHash, // to a Role entry
   pub membrane_eh: EntryHash, // to a Membrane entry
   pub subject: AgentPubKey,
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Role {
   pub name: String,
   pub privileges: Vec<Privilege>,
   pub entering_membrane_ehs: Vec<EntryHash> // to a Membrane entry
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Membrane {
   pub threshold_ehs: Vec<EntryHash>, // To a Threshold entry
}

