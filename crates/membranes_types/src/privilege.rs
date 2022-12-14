use hdi::prelude::*;

#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
pub enum CrudType {
   Create,
   Read,
   Update,
   Delete,
}

#[derive(Clone, PartialEq, Debug, Serialize, Deserialize)]
pub struct Privilege {
   pub entry_def: AppEntryDef,
   pub crud: String,
   //pub condition: String
}