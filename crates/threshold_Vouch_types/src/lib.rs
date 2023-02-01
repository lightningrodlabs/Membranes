#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]

use hdi::prelude::*;

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Vouch {
   pub subject: AgentPubKey,
   pub for_role: String,
}



#[derive(Clone, PartialEq, Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct VouchThreshold {
   pub required_count: usize,
   pub by_role: String,
   pub for_role: String,
}


