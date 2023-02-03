use hdk::prelude::*;
use hdk::prelude::holo_hash::EntryHashB64;
use zome_utils::call_self_cell;
#[allow(unused_imports)]
use tasker_model::*;
use membranes_types::*;
use threshold_Vouch_types::*;
use threshold_CreateEntryCount_types::*;
use threshold_Progenitor_types::build_Progenitor_threshold;

use crate::call_membranes_zome;


///
// pub fn publish_typedTreshold<T: TryFrom<SerializedBytes>>(type_name: &str, typed: T) -> ExternResult<EntryHash>
//    where hdk::prelude::SerializedBytes: From<T>
// {
//    let mth = MembraneThreshold {
//       type_name:  type_name.to_string(),
//       data: SerializedBytes::try_from(typed).unwrap(),
//    };
//    return call_membranes_zome("publish_threshold", mth);
// }


///
pub fn publish_vouchTreshold(required_count: usize, by_role: &str, for_role: &str) -> ExternResult<EntryHash> {
   let vouch_th = VouchThreshold {required_count, by_role: by_role.to_string(), for_role: for_role.to_string()};
   let mth = MembraneThreshold {
      type_name:  VOUCH_THRESHOLD_NAME.to_string(),
      data: SerializedBytes::try_from(vouch_th).unwrap(),
   };
   return call_membranes_zome("publish_threshold", mth);
}



///
pub fn publish_createEntryCountThreshold(entry_type: MyAppEntryType, required_count: usize) -> ExternResult<EntryHash> {
   let vouch_th = CreateEntryCountThreshold {required_count, entry_type};
   let mth = MembraneThreshold {
      type_name:  CREATE_ENTRY_COUNT_THRESHOLD_NAME.to_string(),
      data: SerializedBytes::try_from(vouch_th).unwrap(),
   };
   return call_membranes_zome("publish_threshold", mth);
}



/// Setup pre-defined membranes
pub fn init_membranes(_: ()) -> ExternResult<()> {
   debug!("init_membranes() CALLED");
   //let entry_defs = zome_info()?.entry_defs;

   /// Thresholds
   //let _ah = create_entry(MembranesEntry::Threshold(MembraneThreshold::Progenitor))?;
   let progenitor_th_eh = hash_entry(build_Progenitor_threshold())?;

   let steererVouchThresholdEh = publish_vouchTreshold(1, "participant", "steerer")?;
   let participantVouchThresholdEh: EntryHash = publish_vouchTreshold(1, "participant", "editor")?;

   let createItemThresholdEh: EntryHash = publish_createEntryCountThreshold(MyAppEntryType::from(TaskerEntryTypes::TaskItem.try_into().unwrap()), 1)?;
   let createManyItemThresholdEh: EntryHash = publish_createEntryCountThreshold(MyAppEntryType::from(TaskerEntryTypes::TaskItem.try_into().unwrap()), 3)?;

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