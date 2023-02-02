use hdk::prelude::*;
use zome_utils::{get_all_typed_local, get_typed_from_record};
use membranes_integrity::*;
use membranes_types::ThresholdType;


#[hdk_extern]
pub fn register_threshold_type(tt: ThresholdType) -> ExternResult<ActionHash> {
   debug!("register_threshold_type() {}", tt.name);
   let ah = create_entry(MembranesEntry::ThresholdType(tt))?;
   Ok(ah)
}


///
#[hdk_extern]
pub fn get_all_registered_threshold_types(_ : ()) -> ExternResult<Vec<ThresholdType>> {
   debug!("get_all_registered_threshold_types() zome_info = {:?}", zome_info()?);
   let entry_type = MembranesEntryTypes::ThresholdType.try_into().unwrap();
   debug!("get_all_registered_threshold_types() entry_type = {:?}", entry_type);
   return get_all_typed_local(entry_type);
}


///
#[hdk_extern]
pub fn get_zome_for_threshold(type_name : String) -> ExternResult<String> {
   let tts = get_all_registered_threshold_types(())?;
   for tt in tts {
      if tt.name == type_name {
         return Ok(tt.zome_name);
      }
   }
   return zome_error!("Unknown threshold type\"{}\"", type_name);
}