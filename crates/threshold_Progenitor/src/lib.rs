#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]


mod threshold;


#[macro_use]
extern crate zome_utils;


use hdk::prelude::*;
use zome_utils::call_self_cell;
use membranes_types::*;
use threshold_Progenitor_types::*;
use threshold_Progenitor_integrity::*;


/// Validate DNA properties
fn init_properties() -> ExternResult<InitCallbackResult> {
   //let maybe_dna_properties = ProgenitorThresholdZomeProperties::get();
   //debug!("maybe_dna_properties = {:?}", maybe_dna_properties);

   /// Create progenitor threshold if properties is set
   //if let Ok(props) = &maybe_membrane_zome_properties {
   //let _progenitors = &props.progenitors;
   // FIXME make sure they are valid key hashs.



   let threshold = build_Progenitor_threshold();
   let eh: EntryHash = call_self_cell("zMembranes","publish_threshold", threshold)?;
   debug!("*** Progenitor.init_properties() eh = {:?}", eh);

   /// Create threshold Entry
   //let _ah = create_entry(MembranesEntry::Threshold(threshold))?;
   //let _eh = hash_entry(threshold)?;

   // Add to Index
   //let root_path = Path::from(anchors::Thresholds).path_entry_hash()?;
   //let _lah = create_link(root_path, eh.clone(), MembranesLinkType::Threshold, LinkTag::from("Progenitor".to_string().into_bytes()))?;
   //}
   Ok(InitCallbackResult::Pass)
}


/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
   debug!("*** Progenitor.init() callback - START");
   let _r = init_properties()?;
   let res: ExternResult<ActionHash> = call_self_cell(
      "zMembranes",
      "register_threshold_type",
      ThresholdType { name: PROGENITOR_THRESHOLD_NAME.to_string(), zome_name: zome_info()?.name.to_string()},
   );
   if let Err(e) = res {
      return Ok(InitCallbackResult::Fail(format!("Failed to register threshold type \"{}\": {:?}", PROGENITOR_THRESHOLD_NAME, e)));
   }
   /// Done
   debug!("*** Progenitor.init() callback - DONE");
   Ok(InitCallbackResult::Pass)
}
