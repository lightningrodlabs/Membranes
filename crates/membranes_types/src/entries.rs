
use hdi::prelude::*;

use crate::*;

///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ThresholdType {
   pub name: String,
   pub zome_name: String,
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MembraneCrossedClaim {
   pub proof_ahs: Vec<ActionHash>, // of ThresholdReachedProof
   pub membrane_eh: EntryHash, // of a Membrane
   pub subject: AgentPubKey,
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RoleClaim {
   pub subject: AgentPubKey,
   pub membrane_index: usize,
   pub role_eh: EntryHash, // of a Role
   pub membrane_claim_eh: EntryHash, // of a MembraneCrossedClaim
}



///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MembraneRole {
   pub name: String,
   pub privileges: Vec<Privilege>,
   pub entering_membrane_ehs: Vec<EntryHash> // of Membrane
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Membrane {
   pub threshold_ehs: Vec<EntryHash>, // of MembraneThreshold
}
