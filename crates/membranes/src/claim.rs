use hdk::prelude::*;
use hdk::prelude::holo_hash::{ActionHashB64, AgentPubKeyB64, EntryHashB64};
#[allow(unused_imports)]
use membranes_model::*;


use crate::{
   constants::*,
};
use crate::publish::{publish_MembraneCrossedClaim};
use crate::role::{has_role, HasRoleInput};


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct HasCrossedMembraneInput {
   pub subject: AgentPubKeyB64,
   pub membrane_eh: EntryHashB64,
}

/// Returns entry hash of MembraneCrossedClaim for that Membrane, if exists
/// Return None if subject does not have a claim
#[hdk_extern]
pub fn has_crossed_membrane(input: HasCrossedMembraneInput) -> ExternResult<Option<EntryHashB64>> {
   let agent_id: AgentPubKey = input.subject.into();
   let membrane_eh: EntryHash = input.membrane_eh.into();
   let link_pairs  = zome_utils::get_typed_from_links::<MembraneCrossedClaim>(agent_id, LinkKind::MembranePassport, None)?;
   for (claim, _link) in link_pairs {
      if &claim.membrane_eh == &membrane_eh {
         let eh = hash_entry(claim)?;
         return Ok(Some(eh.into()))
      }
   }
   Ok(None)
}



#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ClaimMembraneInput {
   subject: AgentPubKeyB64,
   membrane_eh: EntryHashB64,
}

///
#[hdk_extern]
pub fn claim_membrane(input: ClaimMembraneInput) -> ExternResult<Option<ActionHashB64>> {
   let agent_id: AgentPubKey = input.subject.clone().into();
   /* Check input */
   let membrane: Membrane = zome_utils::get_typed_from_eh(input.membrane_eh.clone().into())?;
   /// Check all thresholds
   let mut proof = Vec::new();
   for threshold_eh in membrane.threshold_ehs {
      let maybe_threshold_proof = claim_threshold(agent_id.clone(), threshold_eh)?;
      if maybe_threshold_proof.is_none() {
         return Ok(None)
      }
      proof.push(maybe_threshold_proof.unwrap());
   }
   /// Create and publish MembraneCrossedClaim
   let claim = MembraneCrossedClaim {
      proof,
      membrane_eh: input.membrane_eh.into(),
      subject: agent_id.clone(),
   };
   let ah = publish_MembraneCrossedClaim(claim)?;
   /// Done
   Ok(Some(ah.into()))
}


///
fn claim_threshold(subject: AgentPubKey, threshold_eh: EntryHash) -> ExternResult<Option<Vec<SignedActionHashed>>> {
   let threshold: MembraneThreshold = zome_utils::get_typed_from_eh(threshold_eh)?;
   match threshold {
      MembraneThreshold::CreateEntryCount(th) => {
         claim_createEntryCountThreshold(subject, th)
      },
      MembraneThreshold::Vouch(th) => {
         claim_vouchThreshold(subject, th)
      },
   }
}


///
fn claim_vouchThreshold(subject: AgentPubKey, th: VouchThreshold) -> ExternResult<Option<Vec<SignedActionHashed>>> {
   let link_pairs  = zome_utils::get_typed_from_links::<Vouch>(subject.clone(), LinkKind::Vouch, None)?;
   let mut signed_vouches = Vec::new();
   for (vouch, link) in link_pairs {
      /// Vouch must be for this subject
      if vouch.subject != subject { continue }
      /// Vouch author must have required Role
      let author = zome_utils::get_author(&link.target)?;
      let maybe_role_claim = has_role(HasRoleInput{subject: author.into(), role_eh: th.from_role_eh.clone().into()})?;
      if maybe_role_claim.is_none() { continue }
      /// Vouch must be for the right role
      if vouch.for_role_eh != th.for_role_eh { continue }
      /// Get Vouch's SignedActionHashed
      let maybe_sah = get(link.target.clone(), GetOptions::content())?;
      if maybe_sah.is_none() {
         let msg = format!("Could not get link's target entry {}", link.target);
         return Err(wasm_error!(WasmErrorInner::Guest(msg)));
      }
      signed_vouches.push(maybe_sah.unwrap().signed_action);

   }
   if signed_vouches.len() < th.required_count {
      return Ok(None);
   }
   /// Done
   Ok(Some(signed_vouches))
}


///
fn claim_createEntryCountThreshold(subject: AgentPubKey, th: CreateEntryCountThreshold) -> ExternResult<Option<Vec<SignedActionHashed>>> {
   /// Ask subject directly
   // FIXME
   /// Ask subject's neighbours
   let query = ChainQueryFilter::default()
      .include_entries(false)
      .action_type(ActionType::Create)
      .entry_type(EntryType::App(th.entry_type));
   let activity = get_agent_activity(subject, query, ActivityRequest::Full)?;
   let actions = activity.valid_activity;
   debug!("claim_createEntryCountThreshold() valid actions found: {:?}", actions);
   if actions.len() < th.required_count {
      return Ok(None);
   }
   /// Convert actions to signed actions (-_-)
   let mut signed_entries = Vec::new();
   for (_index, ah) in actions {
      let record = get(ah, GetOptions::content())?
         .expect("Should be able to get the action found in agent activity");
      signed_entries.push(record.signed_action)
   }
   /// Done
   Ok(Some(signed_entries))
}

