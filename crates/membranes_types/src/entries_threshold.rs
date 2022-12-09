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
   id: u8,
   zome_id: u8,
   is_public: bool,
}

impl MyAppEntryType {
   pub fn into_typed(self) -> AppEntryType {
      AppEntryType {
         id: self.id.into(),
         zome_id: self.zome_id.into(),
         visibility:  if self.is_public {EntryVisibility::Public} else {EntryVisibility::Private},
      }
   }

   pub fn from(other: AppEntryType) -> MyAppEntryType {
      MyAppEntryType {
         id: other.id.into(),
         zome_id: other.zome_id.into(),
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