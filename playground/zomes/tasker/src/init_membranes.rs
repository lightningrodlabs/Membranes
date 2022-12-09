use hdk::prelude::*;
use hdk::prelude::holo_hash::EntryHashB64;
#[allow(unused_imports)]
use tasker_model::*;
use membranes_types::*;

use crate::call_membranes_zome;


/// Setup pre-defined membranes
pub fn init_membranes(_: ()) -> ExternResult<()> {
   debug!("init_membranes() CALLED");
   //let entry_defs = zome_info()?.entry_defs;

   /// Thresholds
   //let _ah = create_entry(MembranesEntry::Threshold(MembraneThreshold::Progenitor))?;
   let progenitor_th_eh = hash_entry(MembraneThreshold::Progenitor)?;

   let steererVouchThresholdEh: EntryHash = call_membranes_zome(
      "publish_vouchThreshold",
      VouchThreshold {required_count: 1, by_role: "participant".to_string(), for_role: "steerer".to_string()},
   )?;
   let participantVouchThresholdEh: EntryHash = call_membranes_zome(
      "publish_vouchThreshold",
      VouchThreshold {required_count: 1, by_role: "participant".to_string(), for_role: "editor".to_string()},
   )?;
   let createItemThresholdEh: EntryHash = call_membranes_zome(
      "publish_createEntryCountThreshold",
      CreateEntryCountThreshold { entry_type: MyAppEntryType::from(TaskerEntryTypes::TaskItem.try_into().unwrap()), required_count: 1},
   )?;
   let createManyItemThresholdEh: EntryHash = call_membranes_zome(
      "publish_createEntryCountThreshold",
      CreateEntryCountThreshold {entry_type: MyAppEntryType::from(TaskerEntryTypes::TaskItem.try_into().unwrap()), required_count: 3},
   )?;

   /// Membranes
   let progenitorMembraneEh: EntryHash = call_membranes_zome("publish_membrane",  Membrane {threshold_ehs: vec![progenitor_th_eh.clone()]})?;
   let createItemsMembraneEh: EntryHash = call_membranes_zome("publish_membrane",  Membrane {threshold_ehs: vec![createItemThresholdEh.clone()]})?;
   let participantVouchMembraneEh: EntryHash = call_membranes_zome("publish_membrane", Membrane {threshold_ehs: vec![participantVouchThresholdEh]})?;
   //let steererVouchMembraneEh: EntryHash = call_membranes_zome("publish_membrane", Membrane {threshold_ehs: vec![steererVouchThresholdEh]})?;
   let complexMembraneEh: EntryHash = call_membranes_zome( "publish_membrane", Membrane {threshold_ehs: vec![createManyItemThresholdEh, steererVouchThresholdEh]})?;

   /// Roles
    let _progenitorRoleEh: EntryHash = call_membranes_zome(
       "publish_role",
      MembraneRole {name: "progenitor".to_string(), privileges: vec![/* FIXME */], entering_membrane_ehs: vec![progenitorMembraneEh.clone()]},
    )?;
   let participantRoleEh: EntryHash = call_membranes_zome(
      "publish_role",
      MembraneRole {name: "participant".to_string(), privileges: vec![/* FIXME */], entering_membrane_ehs: vec![createItemsMembraneEh.clone()]},
   )?;
   //let participantRoleEh = publish_role( "participant", &[/* FIXME */], &[create10ItemMembraneEh, complexMembraneEh, steererVouchMembraneEh.clone()])?;
   let _editorRoleEh: EntryHash = call_membranes_zome(
      "publish_role",
      MembraneRole {name: "editor".to_string(), privileges: vec![/* FIXME */], entering_membrane_ehs: vec![participantVouchMembraneEh.clone()]},
   )?;
   let _steererRoleEh: EntryHash = call_membranes_zome(
      "publish_role",
      MembraneRole {name: "steerer".to_string(),  privileges: vec![/* FIXME */], entering_membrane_ehs: vec![complexMembraneEh.clone()]},
         )?;

   /// Debug test
   let maybe_proof: Option<SignedActionHashed> = call_membranes_zome(
      "has_role",
      HasRoleInput {subject: agent_info()?.agent_initial_pubkey.into(), role_eh: participantRoleEh.into()})?;
   debug!("Am I steerer? {:?}", maybe_proof);

   /// Done
   debug!("init_membranes() DONE");
   Ok(())
}