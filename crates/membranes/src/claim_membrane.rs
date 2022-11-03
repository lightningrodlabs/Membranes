use hdk::prelude::*;
use hdk::prelude::holo_hash::{ActionHashB64, AgentPubKeyB64, EntryHashB64};
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
   let agent_id: AgentPubKey = input.subject.clone().into();
   /* Check input */
   let membrane: Membrane = zome_utils::get_typed_from_eh(input.membrane_eh.clone().into())?;
   /// Check all thresholds
   let mut proofs = Vec::new();
   for threshold_eh in membrane.threshold_ehs {
      let maybe_threshold_proof = claim_threshold(agent_id.clone(), threshold_eh)?;
      if maybe_threshold_proof.is_none() {
         return Ok(None)
      }
      proofs.push(maybe_threshold_proof.unwrap());
   }
   /// Create and publish MembraneCrossedClaim
   let claim = MembraneCrossedClaim {
      proofs,
      membrane_eh: input.membrane_eh.into(),
      subject: agent_id.clone(),
   };
   let eh = publish_MembraneCrossedClaim(claim)?;
   /// Done
   Ok(Some(eh.into()))
}


/// Returns None if claim failed
fn claim_threshold(subject: AgentPubKey, threshold_eh: EntryHash) -> ExternResult<Option<ThresholdReachedProof>> {
   let threshold: MembraneThreshold = zome_utils::get_typed_from_eh(threshold_eh.clone())?;
   let maybe_sahs = match threshold {
      MembraneThreshold::CreateEntryCount(th) => {
         claim_createEntryCountThreshold(subject, th)?
      },
      MembraneThreshold::Vouch(th) => {
         claim_vouchThreshold(subject, th)?
      },
   };
   Ok(match maybe_sahs {
      None => None,
      Some(signed_actions) => Some(ThresholdReachedProof {
         threshold_eh,
         signed_actions,
      })
   })
}


/// Returns None if claim failed
fn claim_vouchThreshold(subject: AgentPubKey, th: VouchThreshold) -> ExternResult<Option<Vec<SignedActionHashed>>> {
   let link_pairs  = zome_utils::get_typed_from_links::<Vouch>(subject.clone(), MembranesLinkType::Vouch, None)?;
   let mut signed_vouches = Vec::new();
   for (vouch, link) in link_pairs {
      /// Vouch must be for this subject
      if vouch.subject != subject { continue }
      /// Vouch author must have required Role
      let author = zome_utils::get_author(&link.target)?;
      let maybe_role = get_role_by_name(th.by_role.clone())?;
      if maybe_role.is_none() {
         let msg = format!("Could not get Role declared in vouch_threshold: {}", vouch.for_role);
         return Err(wasm_error!(WasmErrorInner::Guest(msg)));
      }
      let role_eh = hash_entry(maybe_role.unwrap())?.into();
      let maybe_role_claim = has_role(HasRoleInput{subject: author.into(), role_eh})?;
      if maybe_role_claim.is_none() { continue }
      /// Vouch must be for the right role
      if vouch.for_role != th.for_role { continue }
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




#[hdk_extern]
fn get_create_count(input: GetCreateCountInput) -> ExternResult<usize> {
   let actions = get_create_entries(input.subject, input.entry_type)?;
   Ok(actions.len())
}


fn get_create_entries(subject: AgentPubKey, entry_type: MyAppEntryType) -> ExternResult<Vec<(u32, ActionHash)>> {
   /// Ask subject directly
   // FIXME
   /// Ask subject's neighbours
   let query = ChainQueryFilter::default()
      .include_entries(false)
      .action_type(ActionType::Create)
      .entry_type(EntryType::App(entry_type.into_typed()));
   let activity = get_agent_activity(subject, query, ActivityRequest::Full)?;
   let actions = activity.valid_activity;
   debug!("get_created_entries() valid actions found: {:?}", actions);
   Ok(actions)
}


/// Returns None if claim failed
fn claim_createEntryCountThreshold(subject: AgentPubKey, th: CreateEntryCountThreshold) -> ExternResult<Option<Vec<SignedActionHashed>>> {
   let actions = get_create_entries(subject, th.entry_type)?;
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

