use hdi::prelude::*;
use holo_hash::{/*ActionHashB64,*/ AgentPubKeyB64, EntryHashB64};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct HasRoleInput {
   pub subject: AgentPubKeyB64,
   pub role_eh: EntryHashB64,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ClaimRoleInput {
   pub subject: AgentPubKeyB64,
   pub role_eh: EntryHashB64,
   pub membrane_index: usize,
}


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct HasCrossedMembraneInput {
   pub subject: AgentPubKeyB64,
   pub membrane_eh: EntryHashB64,
}


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ClaimMembraneInput {
   pub subject: AgentPubKeyB64,
   pub membrane_eh: EntryHashB64,
}
