use hdi::prelude::*;
use membranes_types::*;
//use crate::{MembranesEntryTypes};
//use crate::get_index;
//use crate::zome_properties::is_progenitor;
use crate::*;


fn index_to_variant(entry_def_index: EntryDefIndex) -> ExternResult<MembranesEntryTypes> {
   let mut i = 0;
   for variant in MembranesEntryTypes::iter() {
      if i == entry_def_index.0 {
         return Ok(variant);
      }
      i += 1;
   }
   return Err(wasm_error!(format!("Unknown EntryDefIndex: {}", entry_def_index.0)));
}



///
#[allow(unreachable_patterns)]
//pub(crate) fn validate_app_entry(entry_def_index: EntryDefIndex, entry_bytes: AppEntryBytes)
pub(crate) fn validate_app_entry(_creation_action: EntryCreationAction, entry_def_index: EntryDefIndex, entry: Entry)
   -> ExternResult<ValidateCallbackResult>
{
   let variant = index_to_variant(entry_def_index)?;
   //debug!("*** index: {} => {:?}", entry_def_index.0, variant);
   return match variant {
      MembranesEntryTypes::MembraneCrossedClaim => {
         //assert_eq!(3, get_index(MembranesEntryTypes::MembraneCrossedClaim));
         let membrane_claim = MembraneCrossedClaim::try_from(entry)?;
         return validate_membrane_claim(membrane_claim);
      },
      MembranesEntryTypes::RoleClaim => {
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
fn validate_membrane_claim(membrane_claim: MembraneCrossedClaim) -> ExternResult<ValidateCallbackResult> {
   let membrane_entry = must_get_entry(membrane_claim.membrane_eh.clone().into())?.as_content().to_owned();
   let membrane = Membrane::try_from(membrane_entry)?;
   let mut i = 0;
   for threshold_eh in membrane.threshold_ehs.iter() {
      let threshold_entry = must_get_entry(threshold_eh.clone().into())?.as_content().to_owned();
      let threshold = MembraneThreshold::try_from(threshold_entry)?;
      //debug!("validate_membrane_claim() threshold = {:?}", threshold);
      let proof_ah = membrane_claim.proof_ahs[i].clone();
      let Ok(proof_record) = must_get_valid_record(proof_ah)
         else { return Ok(ValidateCallbackResult::Invalid(format!("Threshold proof record not found ({})", i))); };
      let RecordEntry::Present(entry) = proof_record.entry
         else { return Ok(ValidateCallbackResult::Invalid(format!("Threshold proof entry not present ({})", i))); };
      // let Entry::App(bytes) = entry
      //    else { return Ok(ValidateCallbackResult::Invalid(format!("Threshold proof entry not an App Entry ({})", i))); };
      let proof = ThresholdReachedProof::try_from(entry)?;
      if proof.threshold_eh != hash_entry(threshold.clone())? {
         return Ok(ValidateCallbackResult::Invalid(format!("Threshold proof EntryHash mismatch ({})", i)));
      }
      i+= 1;
   }
   Ok(ValidateCallbackResult::Valid)
}
