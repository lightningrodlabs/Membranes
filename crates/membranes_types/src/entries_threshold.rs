use hdi::prelude::*;


#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum MembraneThreshold {
   CreateEntryCount(CreateEntryCountThreshold),
   Vouch(VouchThreshold),
}

//#[hdk_entry_helper]
#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateEntryCountThreshold {
   pub entry_type: AppEntryType,
   pub required_count: usize,
}

//#[hdk_entry_helper]
#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VouchThreshold {
   pub required_count: usize,
   pub by_role: String,
   pub for_role: String,
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Vouch {
   pub subject: AgentPubKey,
   pub for_role: String,
}


///
#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThresholdReachedProof {
   pub threshold_eh: EntryHash,
   pub signed_actions: Vec<SignedActionHashed>, // List of All signed actions required for proving a threshold
}