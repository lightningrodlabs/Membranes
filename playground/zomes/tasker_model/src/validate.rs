use hdi::prelude::*;
use crate::TaskerEntry::TaskList;
use crate::TaskerLinkType;

use membranes_types::RoleClaim;

///
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
   //debug!("*** membranes.validate() op = {:?}", op);
   match op {
      Op::StoreRecord ( _ ) => Ok(ValidateCallbackResult::Valid),
      Op::StoreEntry(storeEntry) => {
         let actual_action = storeEntry.action.hashed.into_inner().0;
         return validate_entry(storeEntry.entry, Some(actual_action.entry_type()));
      },
      Op::RegisterCreateLink(reg_create_link) => {
         return validate_create_link(reg_create_link.create_link);
      },
      Op::RegisterDeleteLink (_)=> Ok(ValidateCallbackResult::Invalid("Deleting links isn't allowed".to_string())),
      Op::RegisterUpdate { .. } => Ok(ValidateCallbackResult::Valid),
      Op::RegisterDelete { .. } => Ok(ValidateCallbackResult::Invalid("Deleting entries isn't allowed".to_string())),
      Op::RegisterAgentActivity { .. } => Ok(ValidateCallbackResult::Valid),
   }
}


///
pub fn validate_entry(entry: Entry, maybe_entry_type: Option<&EntryType>) -> ExternResult<ValidateCallbackResult> {
   /// Determine where to dispatch according to base
   let result = match entry.clone() {
      Entry::CounterSign(_data, _bytes) => Ok(ValidateCallbackResult::Invalid("CounterSign not allowed".into())),
      Entry::Agent(_agent_key) => Ok(ValidateCallbackResult::Valid),
      Entry::CapClaim(_claim) => Ok(ValidateCallbackResult::Valid),
      Entry::CapGrant(_grant) => Ok(ValidateCallbackResult::Valid),
      Entry::App(_entry_bytes) => {
         let EntryType::App(app_entry_def) = maybe_entry_type.unwrap() 
            else { unreachable!() };
         let entry_def_index = validate_app_entry(app_entry_def.entry_index(), entry);
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
pub(crate) fn validate_app_entry(entry_def_index: EntryDefIndex, _entry: Entry)
   -> ExternResult<ValidateCallbackResult>
{
   debug!("*** validate_app_entry() callback called!");
   return match entry_def_index.into() {
      0 => Ok(ValidateCallbackResult::Valid),
      _ => Ok(ValidateCallbackResult::Valid),
   }
}


/// Validation sub callback
pub fn validate_create_link(signed_create_link: SignedHashed<CreateLink>)
   -> ExternResult<ValidateCallbackResult>
{
   let create_link = signed_create_link.hashed.into_inner().0;
   let tag_str = String::from_utf8_lossy(&create_link.tag.0);
   debug!("*** `validate_create_link({:?})` called | {:?}:{}", create_link, create_link.link_type, tag_str);

   let result = match create_link.link_type.0 {
      // 2 /*TaskerLinkType::TaskLists*/ => {
      //    Ok(ValidateCallbackResult::Invalid("No task lists allowed".to_string()))
      // }
      3 /*TaskerLinkType::Locked*/ => {
         /// Get Claim from Tag
         let res_eh = EntryHash::from_raw_39(create_link.tag.0.to_vec());
         let Ok(eh) = res_eh
            else {return Ok(ValidateCallbackResult::Invalid("Invalid link tag for Locked Link".to_string()))} ;
         debug!("*** tag_hash = {:?}", eh);

         let claim_entry = must_get_entry(eh)?;
         debug!("*** claim_entry = {:?}", claim_entry);

         let claim = RoleClaim::try_from(claim_entry)?;
         debug!("*** maybe_claim = {:?}", claim);

         if claim.subject != create_link.author
         // || claim.role_name != "editor" // FIXME: Should probably add role_name to the claim to make things easier ; otherwise need to add RoleEh to the linkTag...
            {
            return Ok(ValidateCallbackResult::Invalid("Invalid RoleClaim".to_string()))
         }
         Ok(ValidateCallbackResult::Valid)
      }
      _ => Ok(ValidateCallbackResult::Valid),
   };
   result
}
