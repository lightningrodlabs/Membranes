use hdi::prelude::*;

use membranes_types::*;
use threshold_Vouch_types::*;
use std::collections::BTreeMap;
use crate::*;

///
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
   //debug!("*** membranes.validate() op = {:?}", op);
   match op {
      Op::StoreRecord ( _ ) => Ok(ValidateCallbackResult::Valid),
      Op::StoreEntry(storeEntry) => {
         let creation_action = storeEntry.action.hashed.into_inner().0;
         return validate_entry(creation_action.clone(), storeEntry.entry, Some(creation_action.entry_type()));
      },
      Op::RegisterCreateLink(_) => Ok(ValidateCallbackResult::Valid),
      Op::RegisterDeleteLink (_)=> Ok(ValidateCallbackResult::Invalid("Deleting links isn't allowed".to_string())),
      Op::RegisterUpdate { .. } => Ok(ValidateCallbackResult::Valid),
      Op::RegisterDelete { .. } => Ok(ValidateCallbackResult::Invalid("Deleting entries isn't allowed".to_string())),
      Op::RegisterAgentActivity { .. } => Ok(ValidateCallbackResult::Valid),
   }
}


///
pub fn validate_entry(creation_action: EntryCreationAction, entry: Entry, maybe_entry_type: Option<&EntryType>) -> ExternResult<ValidateCallbackResult> {
   /// Determine where to dispatch according to base
   let result = match entry.clone() {
      Entry::CounterSign(_data, _bytes) => Ok(ValidateCallbackResult::Invalid("CounterSign not allowed".into())),
      Entry::Agent(_agent_key) => Ok(ValidateCallbackResult::Valid),
      Entry::CapClaim(_claim) => Ok(ValidateCallbackResult::Valid),
      Entry::CapGrant(_grant) => Ok(ValidateCallbackResult::Valid),
      Entry::App(_entry_bytes) => {
         let EntryType::App(app_entry_def) = maybe_entry_type.unwrap() 
            else { unreachable!() };
         let entry_def_index = validate_app_entry(creation_action, app_entry_def.entry_index(), entry);
         entry_def_index
      },
   };
   /// Done
   //debug!("*** validate_entry() result = {:?}", result);
   result
}


///
#[allow(unreachable_patterns)]
//pub(crate) fn validate_app_entry(entry_def_index: EntryDefIndex, entry_bytes: AppEntryBytes)
pub(crate) fn validate_app_entry(creation_action: EntryCreationAction, entry_def_index: EntryDefIndex, entry: Entry)
   -> ExternResult<ValidateCallbackResult>
{
   debug!("*** validate_app_entry() callback called!");
   return match entry_def_index.into() {
      0 /* VouchProof */ => {
         let proof = ThresholdReachedProof::try_from(entry)?;
         return validate_proof(creation_action.author().to_owned(), proof);

      },
      _ => Ok(ValidateCallbackResult::Valid),
   }
}


///
fn validate_proof(author: AgentPubKey, proof: ThresholdReachedProof) -> ExternResult<ValidateCallbackResult> {
   let threshold_entry = must_get_entry(proof.threshold_eh.clone().into())?.as_content().to_owned();
   let threshold = MembraneThreshold::try_from(threshold_entry)?;
   if threshold.type_name != VOUCH_THRESHOLD_NAME { return Ok(ValidateCallbackResult::Invalid(format!("Threshold not a VouchThreshold"))); }
   let Ok(threshold) = VouchThreshold::try_from(threshold.data) else {
      return Ok(ValidateCallbackResult::Invalid(format!("Threshold not a VouchThreshold")));
   };
   let pass = verify_vouch_threshold(&threshold, author, proof.signed_ahs)?;
   Ok(if pass { ValidateCallbackResult::Valid } else { ValidateCallbackResult::Invalid(format!("Failed validating proof for \"{}\" threshold.", VOUCH_THRESHOLD_NAME)) })
}


///
pub fn verify_vouch_threshold(vt: &VouchThreshold, subject: AgentPubKey, signed_ahs: Vec<SignedActionHash>) -> ExternResult<bool> {
   let vouch_entry_index = get_variant_index::<VouchThresholdEntry>(VouchThresholdEntryTypes::Vouch)?;
   let role_claim_entry_index = 4; // FIXME should not be hardcoded // get_variant_index(MembranesEntryTypes::RoleClaim)?;
   // return Ok(signed_ahs.len() >= th.required_count); // FIXME
   /// First pass: Sort SAH into action maps
   /// FIXME: change to Sets as we dont actually need the SAHs at this stage
   let mut claim_map: BTreeMap<AgentPubKey, SignedActionHash> = BTreeMap::new();
   let mut vouch_map: BTreeMap<AgentPubKey, SignedActionHash> = BTreeMap::new();
   for signed_ah in signed_ahs {
      let Ok(record) = must_get_valid_record(signed_ah.ah.clone())
         else { return Ok(false); };
      let action = record.action().clone();
      /// Must find enough Vouch CreateEntry actions with the correct "for_role" by authors who have the "by_role" role
      let Action::Create(create) = action.clone()
         else { continue; };
      let EntryType::App(app_entry_def) = create.entry_type.clone()
         else { continue; };
      if app_entry_def.entry_index.0 == vouch_entry_index {
         let vouch_entry = must_get_entry(create.entry_hash.clone())?;
         let vouch = Vouch::try_from(vouch_entry)?;
         if vouch.for_role != vt.for_role { continue; }
         if vouch.subject != subject { continue; }
         // FIXME verify signature?
         vouch_map.insert(create.author, signed_ah);
         continue;
      }
      if app_entry_def.entry_index.0 == role_claim_entry_index {
         let role_claim_entry = must_get_entry(create.entry_hash.clone())?;
         let role_claim = RoleClaim::try_from(role_claim_entry)?;
         let role_entry = must_get_entry(role_claim.role_eh)?;
         let role = MembraneRole::try_from(role_entry)?;
         if role.name != vt.by_role { continue; }
         // FIXME verify signature?
         claim_map.insert(role_claim.subject, signed_ah);
         continue;
      }
   }
   debug!("verify_vouch_threshold() vouches = {}", vouch_map.len());
   debug!("verify_vouch_threshold() role_claims = {}", claim_map.len());
   /* Second pass: Must have a valid claim for each vouch author */
   vouch_map = vouch_map.into_iter().filter(|(agent, _)| {
      return claim_map.get(agent).is_some();
   }).collect();
   debug!("verify_vouch_threshold() confirmed vouches = {}", vouch_map.len());
   Ok(vouch_map.len() >= vt.required_count)
}
