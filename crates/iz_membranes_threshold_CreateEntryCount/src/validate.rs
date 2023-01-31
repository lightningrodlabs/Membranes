use hdi::prelude::*;

///
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
   //debug!("*** membranes.validate() op = {:?}", op);
   match op {
      Op::StoreRecord ( _ ) => Ok(ValidateCallbackResult::Valid),
      Op::StoreEntry(storeEntry) => {
         let creation_action = storeEntry.action.hashed.into_inner().0;
         return validate_entry(creation_action, storeEntry.entry, Some(creation_action.entry_type()));
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
      0 /* CreateEntryCountThresholdClaim */ => {
         let proof = ThresholdReachedProof::try_from(entry)?;
         return validate_CreateEntryCountThreshold_claim(creation_action.author(), proof);

      },
      _ => Ok(ValidateCallbackResult::Valid),
   }
}


///
fn validate_CreateEntryCountThreshold_claim(author: AgentPubKey, proof: ThresholdReachedProof) -> ExternResult<ValidateCallbackResult> {
   let threshold_entry = must_get_entry(proof.threshold.clone().into())?.as_content().to_owned();
   let threshold = MembraneThreshold::try_from(threshold_entry)?;
   if threshold.type_name != "CreateEntryCountThreshold" { return Ok(false);}
   let Ok(cec)  = CreateEntryCountThreshold::try_from(threshold.data) else {
      return Ok(false);
   };
   let pass = cec.verify(author, proof.signed_actions)?;
   Ok(if pass { ValidateCallbackResult::Valid} else {ValidateCallbackResult::Invalid(format!("Threshold not reached"))})
}