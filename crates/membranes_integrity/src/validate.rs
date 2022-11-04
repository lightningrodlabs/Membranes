use hdi::prelude::*;
use crate::validate_app_entry::validate_app_entry;

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
         let entry_def_index = if let EntryType::App(app_entry_type) = maybe_entry_type.unwrap() {
            app_entry_type.id()
         } else { unreachable!()};
         validate_app_entry(entry_def_index, entry)
      },
   };
   /// Done
   //debug!("*** validate_entry() result = {:?}", result);
   result
}


/// Validation sub callback
pub fn validate_create_link(signed_create_link: SignedHashed<CreateLink>)
   -> ExternResult<ValidateCallbackResult>
{
   let create_link = signed_create_link.hashed.into_inner().0;
   let tag_str = String::from_utf8_lossy(&create_link.tag.0);
   debug!("*** `validate_create_link()` called: {}", tag_str);

   //for link_kind in LinkKind::iter() {
      /// Get the entries linked
      // let base =
      //    must_get_entry(create_link.base_address.clone().into())?
      //       .as_content()
      //       .to_owned();
      // let target =
      //    must_get_entry(create_link.target_address.clone().into())?
      //       .as_content()
      //       .to_owned();

      // FIXME
      // /// Try validating static link kind
      // if tag_str == link_kind.as_static() {
      //    return link_kind.validate_types(base, target, None);
      // }
      // /// Or try validating dynamic link kind
      // let maybe_hash: ExternResult<AgentPubKey> = link_kind.unconcat_hash(&create_link.tag);
      // //debug!("*** maybe_hash of {} = {:?}", link_kind.as_static(), maybe_hash);
      // if let Ok(from) = maybe_hash {
      //    return link_kind.validate_types(base, target, Some(from));
      // }
  // }

   //Ok(ValidateCallbackResult::Invalid(format!("Unknown tag: {}", tag_str).into()))
   Ok(ValidateCallbackResult::Valid)
}
