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
   pub value: u32,
}

//#[hdk_entry_helper]
#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VouchThreshold {
   pub required_count: u32,
   pub from_role_eh: EntryHash, // Role entry
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Vouch {
   pub subject: AgentPubKey,
   pub for_role_eh: EntryHash, // Role entry
}