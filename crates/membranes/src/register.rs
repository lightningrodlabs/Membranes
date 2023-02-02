use hdk::prelude::*;
use membranes_integrity::MembranesEntry;
use membranes_types::ThresholdType;


#[hdk_extern]
pub fn register_threshold_type(tt: ThresholdType) -> ExternResult<ActionHash> {
   //let tt = ThresholdType { name: type_name };
   let ah = create_entry(MembranesEntry::ThresholdType(tt))?;
   Ok(ah)
}



///
#[hdk_extern]
pub fn get_all_registered_threshold_types(_ : ()) -> ExternResult<Vec<ThresholdType>> {
   Ok(Vec::new())
}