use hdk::prelude::*;
use zome_utils::{get_all_typed_local, get_typed_from_record};
use membranes_integrity::*;
use membranes_types::ThresholdType;


#[hdk_extern]
pub fn register_threshold_type(tt: ThresholdType) -> ExternResult<ActionHash> {
   //let tt = ThresholdType { name: type_name };
   debug!("register_threshold_type() {:?}", tt);
   let ah = create_entry(MembranesEntry::ThresholdType(tt))?;
   Ok(ah)
}



///
#[hdk_extern]
pub fn get_all_registered_threshold_types(_ : ()) -> ExternResult<Vec<ThresholdType>> {
   let entry_type = EntryType::App(AppEntryDef {
      entry_index: get_index::<MembranesEntry>(MembranesEntryTypes::ThresholdType)?.into(),
      zome_index: 0.into(), //FIXME broken zome_info()?.id,
      visibility: EntryVisibility::Public,
   });
   debug!("get_all_registered_threshold_types() entry_type = {:?}", entry_type);
   //let res = get_all_typed_local(entry_type);

   let query_args = ChainQueryFilter::default()
      .include_entries(true)
      .action_type(ActionType::Create)
      .entry_type(entry_type);
   let records = query(query_args)?;

   debug!("get_all_registered_threshold_types() records = {:?}", records);

   /// Get typed for all results
   let mut typeds = Vec::new();
   for record in records {
      let typed: ThresholdType = get_typed_from_record(record.clone())?;
      typeds.push(typed)
   }


   debug!("get_all_registered_threshold_types() res = {:?}", typeds);
   return Ok(typeds);
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