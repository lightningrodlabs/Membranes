use hdk::prelude::*;
use membranes_types::*;

///
#[hdk_extern]
pub fn get_threshold(eh : EntryHash) -> ExternResult<Option<MembraneThreshold>> {
   let maybe_typed = zome_utils::get_typed_from_eh::<MembraneThreshold>(eh);
   match maybe_typed {
      Ok(typed) => Ok(Some(typed)),
      Err(_e) => Ok(None),
   }
}

///
#[hdk_extern]
pub fn get_membrane(eh : EntryHash) -> ExternResult<Option<Membrane>> {
   let maybe_typed = zome_utils::get_typed_from_eh::<Membrane>(eh);
   match maybe_typed {
      Ok(typed) => Ok(Some(typed)),
      Err(_e) => Ok(None),
   }
}
