use hdk::prelude::*;
use hdk::prelude::holo_hash::EntryHashB64;
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
   debug!("init_membranes() CALLED");
   //let entry_defs = zome_info()?.entry_defs;
   /// Thresholds
   let steererVouchThresholdEh: EntryHash = call_membranes_zome(
      "publish_vouchThreshold",
      VouchThreshold {required_count: 1, by_role: "steerer".to_string(), for_role: "participant".to_string()},
   )?;
   // let editorVouchThresholdEh: EntryHash = call_membranes_zome(
   //    "publish_vouchThreshold",
   //    VouchThreshold {required_count: 5, by_role: "editor".to_string(), for_role: "participant".to_string()},
   // )?;
   let unit_entry_type: AppEntryType = TaskerEntryTypes::TaskItem.try_into().unwrap();
   let create3ItemThresholdEh: EntryHash = call_membranes_zome(
      "publish_createEntryCountThreshold",
      CreateEntryCountThreshold { entry_type: MyAppEntryType::from(unit_entry_type), required_count: 3},
   )?;
   // let create10ItemThresholdEh: EntryHash = call_membranes_zome(
   //    "publish_createEntryCountThreshold",
   //    CreateEntryCountThreshold {entry_type: TaskerEntryTypes::TaskItem.try_into().unwrap(), required_count: 10},
   // )?;
   // Membranes
   let steererVouchMembraneEh: EntryHash = call_membranes_zome("publish_membrane", Membrane {threshold_ehs: vec![steererVouchThresholdEh]})?;
   let createItemsMembraneEh: EntryHash = call_membranes_zome("publish_membrane",  Membrane {threshold_ehs: vec![create3ItemThresholdEh]})?;
   // let complexMembraneEh = publish_membrane( &[create3ItemThresholdEh, editorVouchThresholdEh])?;

   /// Roles
   let participantRoleEh: EntryHash = call_membranes_zome(
      "publish_role",
      MembraneRole {name: "participant".to_string(), privileges: vec![/* FIXME */], entering_membrane_ehs: vec![steererVouchMembraneEh.clone()]},
   )?;
   //let participantRoleEh = publish_role( "participant", &[/* FIXME */], &[create10ItemMembraneEh, complexMembraneEh, steererVouchMembraneEh.clone()])?;
   let _editorRoleEh: EntryHash = call_membranes_zome(
      "publish_role",
      MembraneRole {name: "editor".to_string(), privileges: vec![/* FIXME */], entering_membrane_ehs: vec![createItemsMembraneEh.clone()]},
   )?;
   // let _steererRoleEh = publish_role( "steerer",  &[/* FIXME */], &[/* TODO progenitor membrane */])?;

   /// Debug test
   let maybe_proof: Option<SignedActionHashed> = call_membranes_zome(
      "has_role",
      HasRoleInput {subject: agent_info()?.agent_initial_pubkey.into(), role_eh: participantRoleEh.into()})?;
   debug!("Am I steerer? {:?}", maybe_proof);

   /// Done
   debug!("init_membranes() DONE");
   Ok(())
}