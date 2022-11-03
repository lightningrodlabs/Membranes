use hdi::prelude::*;
use holo_hash::{/*ActionHashB64,*/ AgentPubKeyB64, EntryHashB64};
use crate::MyAppEntryType;


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetCreateCountInput {
   pub subject: AgentPubKey,
   pub entry_type: MyAppEntryType,
}


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HasRoleInput {
   pub subject: AgentPubKeyB64,
   pub role_eh: EntryHashB64,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaimRoleInput {
   pub subject: AgentPubKeyB64,
   pub role_eh: EntryHashB64,
   pub membrane_index: usize,
}


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MembraneInput {
   pub subject: AgentPubKeyB64,
   pub membrane_eh: EntryHashB64,
}
