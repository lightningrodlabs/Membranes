#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

use hdi::prelude::*;


/// List of all Link kinds handled by this Zome
#[hdk_link_types]
pub enum AgentDirectoryLinkType {
   Root,
   Agent,
}