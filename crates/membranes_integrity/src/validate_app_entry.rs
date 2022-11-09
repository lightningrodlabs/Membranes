use std::collections::BTreeMap;
use hdi::prelude::*;
use membranes_types::*;
use crate::{MembranesEntryTypes};
use crate::get_index;

///
#[allow(unreachable_patterns)]
//pub(crate) fn validate_app_entry(entry_def_index: EntryDefIndex, entry_bytes: AppEntryBytes)
pub(crate) fn validate_app_entry(entry_def_index: EntryDefIndex, entry: Entry)
   -> ExternResult<ValidateCallbackResult>
{
   debug!("*** validate_app_entry() callback called!");
   return match entry_def_index.into() {
      2 => {
         //assert_eq!(2, get_index(MembranesEntryTypes::MembraneCrossedClaim));
         //debug!("validate_app_entry() membrane_claim index = {:?}", get_index(MembranesEntryTypes::MembraneCrossedClaim));
         let membrane_claim = MembraneCrossedClaim::try_from(entry)?;
         return validate_membrane_claim(membrane_claim);

      },
      4 => {
         debug!("validate_app_entry() role_claim index = {:?}", get_index(MembranesEntryTypes::RoleClaim));
         let role_claim = RoleClaim::try_from(entry)?;
         return validate_role_claim(role_claim);
      },
      _ => Ok(ValidateCallbackResult::Valid),
   }
}


///
fn validate_role_claim(role_claim: RoleClaim) -> ExternResult<ValidateCallbackResult> {
   //debug!("validate_role_claim() membrane_claim_eh = {}", role_claim.membrane_claim_eh);
   let membrane_claim_entry = must_get_entry(role_claim.membrane_claim_eh.clone().into())?.as_content().to_owned();
   let membrane_claim = MembraneCrossedClaim::try_from(membrane_claim_entry)?;
   let role_entry = must_get_entry(role_claim.role_eh.clone().into())?.as_content().to_owned();
   let role = MembraneRole::try_from(role_entry)?;
   /// RoleClaim subject and MembraneClaim subject must be equal
   if role_claim.subject != membrane_claim.subject {
      return Ok(ValidateCallbackResult::Invalid(format!("MembraneClaim and RoleClaim subject mismatch ({} != {})", role_claim.subject, membrane_claim.subject)));
   }
   /// MembraneClaim's membrane must be equal to Role's membrane
   if role_claim.membrane_index >= role.entering_membrane_ehs.len() {
      return Ok(ValidateCallbackResult::Invalid(format!("Invalid membrane_index")));
   }
   if role.entering_membrane_ehs[role_claim.membrane_index] != membrane_claim.membrane_eh {
      return Ok(ValidateCallbackResult::Invalid(format!("Membrane mismatch")));
   }
   /// Done
   Ok(ValidateCallbackResult::Valid)
}


///
fn validate_membrane_claim(membrane_claim: MembraneCrossedClaim) -> ExternResult<ValidateCallbackResult> {
   let membrane_entry = must_get_entry(membrane_claim.membrane_eh.clone().into())?.as_content().to_owned();
   let membrane = Membrane::try_from(membrane_entry)?;
   let mut i = 0;
   for threshold_eh in membrane.threshold_ehs.iter() {
      let threshold_entry = must_get_entry(threshold_eh.clone().into())?.as_content().to_owned();
      let threshold = MembraneThreshold::try_from(threshold_entry)?;
      debug!("validate_app_entry() threshold = {:?}", threshold);
      let proof = membrane_claim.proofs[i].clone();
      if proof.threshold_eh != hash_entry(threshold.clone())? {
         return Ok(ValidateCallbackResult::Invalid(format!("Threshold proof mismatch ({})", i)));
      }
      let success = verify_threshold_proof(membrane_claim.subject.clone(), threshold, proof.signed_actions)?;
      if !success {
         return Ok(ValidateCallbackResult::Invalid(format!("Failed to verify threshold {}", i)));
      }
      i+= 1;
   }
   Ok(ValidateCallbackResult::Valid)
}


///
fn verify_threshold_proof(subject: AgentPubKey, threshold: MembraneThreshold, signed_actions: Vec<SignedActionHashed>) -> ExternResult<bool> {
   match threshold {
      MembraneThreshold::CreateEntryCount(th) => {
         let threshold_entry_type = th.entry_type.clone().into_typed();
         /// Must find enough CreateEntry actions by the subject for the correct entry type
         let mut confirmed_count = 0;
         for signed_action in signed_actions {
            let action = signed_action.action().clone();
            let valid_signature = verify_signature(subject.clone(), signed_action.signature, action.clone())?;
            if !valid_signature {
               continue;
            }
            let Action::Create(create) = action.clone() else { continue };
            let EntryType::App(app_entry_type) = create.entry_type.clone() else { continue };
            if create.author == subject && app_entry_type == threshold_entry_type {
               confirmed_count += 1;
            }
            
         }
         //debug!("verify_threshold_proof() CreateEntryCount confirmed_count = {}", confirmed_count);
         if confirmed_count < th.required_count {
            return Ok(false);
         }
      },
      MembraneThreshold::Vouch(th) => {
         let this_zome_id = zome_info()?.id;
         let vouch_entry_id = get_index(MembranesEntryTypes::Vouch)?;
         let role_claim_entry_id = get_index(MembranesEntryTypes::RoleClaim)?;
         // return Ok(signed_actions.len() >= th.required_count); // FIXME
         /// First pass: Sort SAH into action maps
         /// FIXME: change to Sets as we dont actually need the SAHs at this stage
         let mut claim_map: BTreeMap<AgentPubKey, SignedActionHashed> = BTreeMap::new();
         let mut vouch_map: BTreeMap<AgentPubKey, SignedActionHashed> = BTreeMap::new();
         for signed_action in signed_actions {
            let action = signed_action.action().clone();
            /// Must find enough Vouch CreateEntry actions with the correct "for_role" by authors who have the "by_role" role
            if let Action::Create(create) = action.clone() {
               if let EntryType::App(app_entry_type) = create.entry_type.clone() {
                  if app_entry_type.zome_id != this_zome_id { continue; }
                  if app_entry_type.id.0 == vouch_entry_id {
                     let vouch_entry = must_get_entry(create.entry_hash.clone())?;
                     let vouch = Vouch::try_from(vouch_entry)?;
                     if vouch.for_role != th.for_role { continue; }
                     if vouch.subject != subject { continue; }
                     // FIXME verify signature?
                     vouch_map.insert(create.author, signed_action);
                     continue;
                  }
                  if app_entry_type.id.0 == role_claim_entry_id {
                     let role_claim_entry = must_get_entry(create.entry_hash.clone())?;
                     let role_claim = RoleClaim::try_from(role_claim_entry)?;
                     let role_entry = must_get_entry(role_claim.role_eh)?;
                     let role = MembraneRole::try_from(role_entry)?;
                     if role.name != th.by_role { continue; }
                     // FIXME verify signature?
                     claim_map.insert(role_claim.subject, signed_action);
                     continue;
                  }
               }
            }
         }
         debug!("verify_threshold_proof() vouches = {}", vouch_map.len());
         debug!("verify_threshold_proof() role_claims = {}", claim_map.len());
         /* Second pass: Must have a valid claim for each vouch author */
         vouch_map = vouch_map.into_iter().filter(|(agent, _)| {
            return claim_map.get(agent).is_some();
         }).collect();
         debug!("verify_threshold_proof() confirmed vouches = {}", vouch_map.len());
         if vouch_map.len() < th.required_count {
            return Ok(false);
         }
      },
   }
   Ok(true)
}