use hdi::prelude::*;


#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum MembraneThreshold {
   CreateEntryCount(CreateEntryCountThreshold),
   Vouch(VouchThreshold),
   Progenitor,
}

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


//#[hdk_entry_helper]
#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateEntryCountThreshold {
   pub entry_type: MyAppEntryType,
   pub required_count: usize,
}

//#[hdk_entry_helper]
#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VouchThreshold {
   pub required_count: usize,
   pub by_role: String,
   pub for_role: String,
}


///
#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThresholdReachedProof {
   pub threshold_eh: EntryHash,
   pub signed_actions: Vec<SignedActionHashed>, // List of All signed actions required for proving a threshold
}