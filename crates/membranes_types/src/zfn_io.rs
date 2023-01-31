use hdi::prelude::*;
use holo_hash::{/*ActionHashB64,*/ AgentPubKeyB64, EntryHashB64};


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HasRoleInput {
   pub subject: AgentPubKey,
   pub role_eh: EntryHash,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaimRoleInput {
   pub subject: AgentPubKey,
   pub role_eh: EntryHash,
   pub membrane_index: usize,
}


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MembraneInput {
   pub subject: AgentPubKey,
   pub membrane_eh: EntryHash,
}
