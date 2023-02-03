#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]


mod vouch;
mod threshold;


#[macro_use]
extern crate zome_utils;


use std::collections::BTreeMap;
use hdk::prelude::*;
//use membranes::*;
use membranes_types::*;
use threshold_Vouch_types::*;
use threshold_Vouch_integrity::*;
use zome_utils::call_self_cell;
//use crate::anchors::*;


/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
   debug!("*** Vouch.init() callback - START");
   let res: ExternResult<ActionHash> = call_self_cell(
      "zMembranes",
      "register_threshold_type",
      ThresholdType { name: VOUCH_THRESHOLD_NAME.to_string(), zome_name: zome_info()?.name.to_string()});
   if let Err(e) = res {
      return Ok(InitCallbackResult::Fail(format!("Failed to register threshold type \"{}\": {:?}", VOUCH_THRESHOLD_NAME, e)));
   }
   /// Done
   debug!("*** Vouch.init() callback - DONE");
   Ok(InitCallbackResult::Pass)
}



///
#[hdk_extern]
pub fn get_all_role_names(_ : ()) -> ExternResult<Vec<String>> {
   let result_pairs: Vec<(EntryHash, MembraneRole)> = call_self_cell("zMembranes", "get_all_roles_details", ())?;
   debug!("role details found: {}", result_pairs.len());
   let mut result = Vec::new();
   for (_eh, role) in result_pairs {
      result.push(role.name)
   }
   Ok(result)
}
