
use hdi::prelude::*;

use crate::*;

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Vouch {
   pub subject: AgentPubKey,
   pub for_role: String,
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MembraneCrossedClaim {
   pub proofs: Vec<ThresholdReachedProof>,
   pub membrane_eh: EntryHash, // to a Membrane entry
   pub subject: AgentPubKey,
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RoleClaim {
   pub subject: AgentPubKey,
   pub membrane_index: usize,
   pub role_eh: EntryHash, // to Role entry
   pub membrane_claim_eh: EntryHash, // to MembraneCrossedClaim entry
}



///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MembraneRole {
   pub name: String,
   pub privileges: Vec<Privilege>,
   pub entering_membrane_ehs: Vec<EntryHash> // to a Membrane entry
}


///
#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Membrane {
   pub threshold_ehs: Vec<EntryHash>, // To a Threshold entry
}
