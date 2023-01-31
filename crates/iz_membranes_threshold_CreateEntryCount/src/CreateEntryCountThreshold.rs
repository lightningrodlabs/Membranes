use hdi::prelude::*;

//#[hdk_entry_helper]
#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateEntryCountThreshold {
   pub entry_type: MyAppEntryType,
   pub required_count: usize,
}


///
impl CreateEntryCountThreshold {
   ///
   fn verify(&self, subject: AgentPubKey, signed_actions: Vec<SignedActionHashed>) -> ExternResult<bool> {
      let threshold_entry_type = self.entry_type.clone().into_typed();
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
      Ok(confirmed_count >= required_count)
   }
}

