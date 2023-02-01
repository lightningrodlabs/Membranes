use hdi::prelude::*;
use membranes_types::*;
//use crate::{MembranesEntryTypes};
//use crate::get_index;
//use crate::zome_properties::is_progenitor;


///
#[allow(unreachable_patterns)]
//pub(crate) fn validate_app_entry(entry_def_index: EntryDefIndex, entry_bytes: AppEntryBytes)
pub(crate) fn validate_app_entry(_creation_action: EntryCreationAction, entry_def_index: EntryDefIndex, entry: Entry)
   -> ExternResult<ValidateCallbackResult>
{
   //debug!("*** validate_app_entry() callback called!");
   return match entry_def_index.into() {
      2 /* MembraneCrossedClaim*/ => {
         //assert_eq!(2, get_index(MembranesEntryTypes::MembraneCrossedClaim));
         //debug!("validate_app_entry() membrane_claim index = {:?}", get_index(MembranesEntryTypes::MembraneCrossedClaim));
         let membrane_claim = MembraneCrossedClaim::try_from(entry)?;
         return validate_membrane_claim(membrane_claim);

      },
      4 /* RoleClaim */ => {
         //debug!("validate_app_entry() role_claim index = {:?}", get_index(MembranesEntryTypes::RoleClaim));
         let role_claim = RoleClaim::try_from(entry)?;
         return validate_role_claim(role_claim);
      },
      _ => Ok(ValidateCallbackResult::Valid),
   }
}


///
fn validate_role_claim(role_claim: RoleClaim) -> ExternResult<ValidateCallbackResult> {
   //debug!("validate_role_claim() membrane_claim_eh = {}", role_claim.membrane_claim_eh);
   ///
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
fn validate_membrane_claim(_membrane_claim: MembraneCrossedClaim) -> ExternResult<ValidateCallbackResult> {
   //let membrane_entry = must_get_entry(membrane_claim.membrane_eh.clone().into())?.as_content().to_owned();
   //let membrane = Membrane::try_from(membrane_entry)?;
   //let mut i = 0;
   //for threshold_eh in membrane.threshold_ehs.iter() {
      //let threshold_entry = must_get_entry(threshold_eh.clone().into())?.as_content().to_owned();
      //let threshold = MembraneThreshold::try_from(threshold_entry)?;
      //debug!("validate_app_entry() threshold = {:?}", threshold);
      //let proof = membrane_claim.proofs[i].clone();
      // if proof.threshold_eh != hash_entry(threshold.clone())? {
      //    return Ok(ValidateCallbackResult::Invalid(format!("Threshold proof mismatch ({})", i)));
      // }
      //let success = verify_threshold_proof(membrane_claim.subject.clone(), proof.signed_actions, threshold_entry)?;
      // if !success {
      //    return Ok(ValidateCallbackResult::Invalid(format!("Failed to verify threshold {}", i)));
      // }
      //i+= 1;
   //}
   Ok(ValidateCallbackResult::Valid)
}


//
// ///
// fn verify_threshold_proof(subject: AgentPubKey, threshold: MembraneThreshold, signed_actions: Vec<SignedActionHashed>) -> ExternResult<bool> {
//    match threshold {
//       MembraneThreshold::Progenitor => {
//          return is_progenitor(subject);
//       },
//    }
//    Ok(true)
// }