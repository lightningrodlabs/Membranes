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
   let vth1 = VouchThreshold {required_count: 1, by_role: "steerer".to_string(), for_role: "participant".to_string()};
   let steererVouchThresholdEh: EntryHash = call_membranes_zome("publish_vouchThreshold", vth1)?;
   // let editorVouchThresholdEh = publish_vouchThreshold( 5, "editor", "participant")?;
   // let create3ItemThresholdEh = publish_createEntryCountThreshold( UnitEntryTypes::TaskItem.try_into().unwrap(), 3)?;
   // let create10ItemThresholdEh = publish_createEntryCountThreshold( UnitEntryTypes::TaskItem.try_into().unwrap(), 10)?;

   // Membranes
   let m1 = Membrane {threshold_ehs: vec![steererVouchThresholdEh]};
   let steererVouchMembraneEh: EntryHash = call_membranes_zome("publish_membrane", m1)?;
   // let create10ItemMembraneEh = publish_membrane( &[create10ItemThresholdEh])?;
   // let complexMembraneEh = publish_membrane( &[create3ItemThresholdEh, editorVouchThresholdEh])?;

   /// Roles
   let participant_role = MembraneRole {name: "participant".to_string(), privileges: vec![/* FIXME */], entering_membrane_ehs: vec![steererVouchMembraneEh.clone()]};
   let participantRoleEh: EntryHash = call_membranes_zome("publish_role", participant_role)?;
   //let participantRoleEh = publish_role( "participant", &[/* FIXME */], &[create10ItemMembraneEh, complexMembraneEh, steererVouchMembraneEh.clone()])?;
   // let _editorRoleEh = publish_role( "editor",  &[/* FIXME */], &[steererVouchMembraneEh])?;
   // let _steererRoleEh = publish_role( "steerer",  &[/* FIXME */], &[/* TODO progenitor membrane */])?;
   let payload = HasRoleInput {subject: agent_info()?.agent_initial_pubkey.into(), role_eh: participantRoleEh.into()};
   let maybe_proof: Option<SignedActionHashed> = call_membranes_zome("has_role", payload)?;
   debug!("Am I steerer? {:?}", maybe_proof);

   debug!("init_membranes() DONE");

   /// Done
   Ok(())
}