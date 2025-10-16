use hdi::prelude::*;

// FIXME use bitflags instead
#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
pub enum CrudType {
   Create,
   //Read,
   Update,
   Delete,
}

#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
pub struct Privilege {
   pub entry_def: AppEntryDef,
   pub crud: String, // FIXME use bitflags instead
   //pub condition: String
}