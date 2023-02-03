use hdi::prelude::*;


#[derive(Clone, PartialEq, Debug, SerializedBytes, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignedActionHash {
   pub ah: ActionHash,
   pub signature: Signature,
}


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
   pub signed_ahs: Vec<SignedActionHash>, // List of All signed action hashess required for proving a threshold
}