#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]

use hdi::prelude::*;
use hdi::prelude::holo_hash::AgentPubKeyB64;
use membranes_types::MembraneThreshold;


pub const PROGENITOR_THRESHOLD_NAME: &str = "Progenitor";


// #[derive(Clone, PartialEq, Debug, Serialize, Deserialize, SerializedBytes)]
// #[serde(rename_all = "camelCase")]
// pub struct ProgenitorThreshold {
//    pub progenitors: Vec<AgentPubKeyB64>,
// }


pub fn build_Progenitor_threshold() -> MembraneThreshold {
   MembraneThreshold {
      type_name: PROGENITOR_THRESHOLD_NAME.to_string(),
      data: SerializedBytes::default(),
   }
}