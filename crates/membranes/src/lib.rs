#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]

mod callbacks;
mod constants;

mod membrane;
mod publish;
mod role;
//mod utils;
mod anchors;
mod claim_membrane;
mod claim_role;
mod get;
mod misc;
mod register;

#[macro_use]
extern crate zome_utils;

use hdk::hdi::hdk_extern;
use hdk::info::dna_info;
use hdk::map_extern::ExternResult;
use hdk::prelude::ZomeName;
use hdk::prelude::holo_hash::EntryHashB64;
//pub use utils::*;
pub use anchors::*;
pub use constants::*;
pub use get::*;
pub use membrane::*;
use membranes_types::ClaimRoleInput;
pub use publish::*;
pub use role::*;
