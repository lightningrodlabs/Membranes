use std::collections::BTreeMap;
use hdk::prelude::*;
use hdk::prelude::holo_hash::{ActionHashB64, AgentPubKeyB64, EntryHashB64};
use serde::__private::de::Content::String;
#[allow(unused_imports)]
use membranes_integrity::*;
use membranes_types::*;

use crate::{anchors::*, constants::*};
use crate::anchors::get_role_by_name;
use crate::publish::{publish_MembraneCrossedClaim};
use crate::role::{has_role};



///
#[hdk_extern]
pub fn claim_all_membranes(_: ()) -> ExternResult<usize> {
   /// Get all Membranes
   let membranes: Vec<(EntryHash, Membrane)> = get_all_membranes_details(())?;
   /// Claim each Membrane
   let mut claim_count = 0;
   for (_eh, membrane) in membranes {
      let membrane_eh = hash_entry(membrane)?;
      let maybe_claim: Option<EntryHashB64> = claim_membrane(MembraneInput {
         subject: agent_info()?.agent_initial_pubkey.into(),
         membrane_eh: membrane_eh.into(),
      })?;
      debug!("maybe_claimed_membrane: {:?}", maybe_claim);
      if maybe_claim.is_some() {
         claim_count += 1;
      }
   }
   Ok(claim_count)
}


/// Returns a MembraneCrossedClaim EntryHash on success, None if claim failed
#[hdk_extern]
pub fn claim_membrane(input: MembraneInput) -> ExternResult<Option<EntryHashB64>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   debug!("claim_membrane() {:?}", input.membrane_eh);
   let agent_id: AgentPubKey = input.subject.clone().into();
   /* Check input */
   let membrane: Membrane = zome_utils::get_typed_from_eh(input.membrane_eh.clone().into())?;
   /// Check all thresholds
   let mut proof_ahs = Vec::new();
   for threshold_eh in membrane.threshold_ehs {
      let maybe_threshold_proof = claim_threshold(agent_id.clone(), threshold_eh)?;
      if maybe_threshold_proof.is_none() {
         return Ok(None)
      }
      proof_ahs.push(maybe_threshold_proof.unwrap());
   }
   /// Create and publish MembraneCrossedClaim
   let claim = MembraneCrossedClaim {
      proof_ahs,
      membrane_eh: input.membrane_eh.into(),
      subject: agent_id.clone(),
   };
   let eh = publish_MembraneCrossedClaim(claim)?;
   /// Done
   Ok(Some(eh.into()))
}


/// Returns ActionHash of ThresholdProof, None if claim failed
fn claim_threshold(_subject: AgentPubKey, _threshold_eh: EntryHash) -> ExternResult<Option<ActionHash>> {
   // FIXME
   // Solution A: Call "claim_threshold_<thresholdTypeName>" on threshold zome ?
   // Solution B: Thresholds must already be claimed by other zomes :(
   /// Done
   Ok(None)
}