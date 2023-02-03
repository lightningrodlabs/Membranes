use hdi::prelude::*;


#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MembraneThreshold {
   pub type_name: String,
   pub data: SerializedBytes,
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ThresholdReachedProof {
   pub threshold_eh: EntryHash,
   pub signed_actions: Vec<SignedActionHashed>, // List of All signed actions required for proving a threshold
}