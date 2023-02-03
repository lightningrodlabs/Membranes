#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]

use hdi::prelude::*;
use membranes_types::SignedActionHash;


pub const CREATE_ENTRY_COUNT_THRESHOLD_NAME: &str = "CreateEntryCount";


#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MyAppEntryType {
   entry_index: u8,
   zome_index: u8,
   is_public: bool,
}

impl MyAppEntryType {
   pub fn into_typed(self) -> AppEntryDef {
      AppEntryDef {
         entry_index: self.entry_index.into(),
         zome_index: self.zome_index.into(),
         visibility:  if self.is_public {EntryVisibility::Public} else {EntryVisibility::Private},
      }
   }

   pub fn from(other: AppEntryDef) -> MyAppEntryType {
      MyAppEntryType {
         entry_index: other.entry_index.into(),
         zome_index: other.zome_index.into(),
         is_public:  other.visibility == EntryVisibility::Public,
      }
   }
}


#[derive(Clone, PartialEq, Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct CreateEntryCountThreshold {
   pub entry_type: MyAppEntryType,
   pub required_count: usize,
}


///
impl CreateEntryCountThreshold {
   ///
   pub fn verify(&self, subject: AgentPubKey, signed_ahs: Vec<SignedActionHash>) -> ExternResult<bool> {
      let threshold_entry_type = self.entry_type.clone().into_typed();
      /// Must find enough CreateEntry actions by the subject for the correct entry type
      let mut confirmed_count = 0;
      for signed_ah in signed_ahs {
         let Ok(record) = must_get_valid_record(signed_ah.ah)
            else { return Ok(false); };
         let action = record.action().clone();
         let valid_signature = verify_signature(subject.clone(), signed_ah.signature, action.clone())?;
         if !valid_signature {
            continue;
         }
         let Action::Create(create) = action.clone() else { continue };
         let EntryType::App(app_entry_type) = create.entry_type.clone() else { continue };
         if create.author == subject && app_entry_type == threshold_entry_type {
            confirmed_count += 1;
         }
      }
      Ok(confirmed_count >= self.required_count)
   }
}


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetCreateCountInput {
   pub subject: AgentPubKey,
   pub entry_type: MyAppEntryType,
}

