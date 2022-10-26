use hdk::prelude::*;
#[allow(unused_imports)]
use tasker_model::*;
use membranes_types::*;

use crate::call_membranes_zome;

// /// Setup
// #[hdk_extern]
// fn init(_: ()) -> ExternResult<InitCallbackResult> {
//    debug!("*** init() callback START");
//    init_caps(())?;
//    init_anchors(())?;
//    /// Done
//    debug!("*** init() callback DONE");
//    Ok(InitCallbackResult::Pass)
// }

/// Setup pre-defined membranes
pub fn init_membranes(_: ()) -> ExternResult<()> {
   //let entry_defs = zome_info()?.entry_defs;
   /// Thresholds
   let vth1 = VouchThreshold {required_count: 1, by_role: "steerer".to_string(), for_role: "participant".to_string()};
   let steererVouchThresholdEh = call_membranes_zome("publish_vouchThreshold", vth1)?;
   // let editorVouchThresholdEh = publish_vouchThreshold( 5, "editor", "participant")?;
   // let create3ItemThresholdEh = publish_createEntryCountThreshold( UnitEntryTypes::TaskItem.try_into().unwrap(), 3)?;
   // let create10ItemThresholdEh = publish_createEntryCountThreshold( UnitEntryTypes::TaskItem.try_into().unwrap(), 10)?;
   // /// Membranes
   // let steererVouchMembraneEh = publish_membrane( &[steererVouchThresholdEh])?;
   // let create10ItemMembraneEh = publish_membrane( &[create10ItemThresholdEh])?;
   // let complexMembraneEh = publish_membrane( &[create3ItemThresholdEh, editorVouchThresholdEh])?;
   // /// Roles
   // let _participantRoleEh = publish_role( "participant", &[/* FIXME */], &[create10ItemMembraneEh, complexMembraneEh, steererVouchMembraneEh.clone()])?;
   // let _editorRoleEh = publish_role( "editor",  &[/* FIXME */], &[steererVouchMembraneEh])?;
   // let _steererRoleEh = publish_role( "steerer",  &[/* FIXME */], &[/* TODO progenitor membrane */])?;
   /// Done
   Ok(())
}