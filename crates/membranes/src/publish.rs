use hdk::prelude::*;
use hdk::prelude::holo_hash::EntryHashB64;
//use hdk::prelude::holo_hash::AgentPubKeyB64;
#[allow(unused_imports)]
use membranes_types::*;
use membranes_integrity::*;

use crate::{constants::*, anchors};
use crate::anchors::get_role_by_name;


///
#[hdk_extern]
pub fn publish_vouch(vouch: Vouch) -> ExternResult<EntryHash> {
   let maybe_role = get_role_by_name(vouch.for_role.clone())?;
   if maybe_role.is_none() {
      let msg = format!("Could not get Role declared in Vouch: {}", vouch.for_role);
      return Err(wasm_error!(WasmErrorInner::Guest(msg)));
   }
   let role_name_bytes = maybe_role.unwrap().name.into_bytes();
   let _ah = create_entry(MembranesEntry::Vouch(vouch.clone()))?;
   let eh = hash_entry(vouch.clone())?;
   let _lah = create_link(vouch.subject, eh.clone(), MembranesLinkType::Vouch, LinkTag::from(role_name_bytes))?;
   /// Done
   Ok(eh)
}


//#[hdk_extern]
// pub fn publish_threshold(threshold: MembraneThreshold) -> ExternResult<EntryHash> {
//    let eh = match threshold {
//       MembraneThreshold::CreateEntryCount(th) => {
//          publish_createEntryCountThreshold(th)?
//       },
//       MembraneThreshold::Vouch(th) => {
//          publish_vouchThreshold(th)?
//       },
//    };
//    let root_path = Path::from(path_kind::Thresholds).path_entry_hash()?;
//    let _lah = create_link(root_path, eh.clone(), LinkKind::Threshold, LinkTag::from(()))?;
//    /// Done
//    Ok(eh)
// }


#[hdk_extern]
pub fn publish_vouchThreshold(vouch_threshold: VouchThreshold) -> ExternResult<EntryHash> {
   // /// Make sure role exists
   // let maybe_for_role = path_kind::get_role(vouch_threshold.for_role.clone())?;
   // if maybe_for_role.is_none() {
   //    let msg = format!("Could not get Role declared in Vouch: {}", vouch.for_role);
   //    return Err(wasm_error!(WasmErrorInner::Guest(msg)));
   // }
   // let maybe_from_role = path_kind::get_role(vouch_threshold.from_role.clone())?;
   // if maybe_from_role.is_none() {
   //    let msg = format!("Could not get Role declared in Vouch: {}", vouch.for_role);
   //    return Err(wasm_error!(WasmErrorInner::Guest(msg)));
   // }
   /// Create Entry
   let threshold = MembraneThreshold::Vouch(vouch_threshold);
   let _ah = create_entry(MembranesEntry::Threshold(threshold.clone()))?;
   let eh = hash_entry(threshold.clone())?;
   /// Add to Index
   let root_path = Path::from(anchors::Thresholds).path_entry_hash()?;
   let _lah = create_link(root_path, eh.clone(), MembranesLinkType::Threshold, LinkTag::from("VouchThreshold".to_string().into_bytes()))?;
   /// Done
   Ok(eh)
}


#[hdk_extern]
pub fn publish_createEntryCountThreshold(create_threshold: CreateEntryCountThreshold) -> ExternResult<EntryHash> {
   /// Make sure AppEntryType exists
   /// FIXME
   /// Create Entry
   let threshold = MembraneThreshold::CreateEntryCount(create_threshold);
   let _ah = create_entry(MembranesEntry::Threshold(threshold.clone()))?;
   let eh = hash_entry(threshold.clone())?;
   /// Add to Index
   let root_path = Path::from(anchors::Thresholds).path_entry_hash()?;
   let _lah = create_link(root_path, eh.clone(), MembranesLinkType::Threshold, LinkTag::from("CreateEntryCountThreshold".to_string().into_bytes()))?;
   /// Done
   Ok(eh)
}


///
#[hdk_extern]
pub fn publish_membrane(membrane: Membrane) -> ExternResult<EntryHash> {
   /* Check all thresholds exists */
   for threshold_eh in membrane.threshold_ehs.clone() {
      let _threshold: MembraneThreshold = zome_utils::get_typed_from_eh(threshold_eh)?;
   }
   /// Create Entry
   let _ah = create_entry(MembranesEntry::Membrane(membrane.clone()))?;
   let eh = hash_entry(membrane.clone())?;
   /// Link entry to index
   let root_path = Path::from(anchors::Membranes).path_entry_hash()?;
   let _lah = create_link(root_path, eh.clone(), MembranesLinkType::Membrane, LinkTag::from(()))?;
   /// Done
   Ok(eh)
}


///
#[hdk_extern]
pub fn publish_role(role: MembraneRole) -> ExternResult<EntryHash> {
   /* Check all thresholds exists */
   for membrane_eh in role.entering_membrane_ehs.clone() {
      let _typed: Membrane = zome_utils::get_typed_from_eh(membrane_eh)?;
   }
   /// Create Entry
   let _ah = create_entry(MembranesEntry::Role(role.clone()))?;
   let eh = hash_entry(role.clone())?;
   /// Link entry to index
   let root_path = Path::from(anchors::Roles).path_entry_hash()?;
   let lah = create_link(root_path, eh.clone(), MembranesLinkType::Role, LinkTag::from(()))?;
   debug!("publish_role() LinkActionHash: {:?}", lah);
   /// Done
   Ok(eh)
}


///
#[hdk_extern]
pub fn publish_RoleClaim(claim: RoleClaim) -> ExternResult<EntryHash> {
   /* Input Checks */
   let _role: MembraneRole = zome_utils::get_typed_from_eh(claim.role_eh.clone())?;
   let _membrane_claim: MembraneCrossedClaim = zome_utils::get_typed_from_eh(claim.membrane_claim_eh.clone())?;
   /// Create Entry
   let _ah = create_entry(MembranesEntry::RoleClaim(claim.clone()))?;
   let eh = hash_entry(claim.clone())?;
   //let eh = hash_entry(claim.clone())?;
   /// Create Link from subject
   let _lah = create_link(claim.subject, eh.clone(), MembranesLinkType::RolePassport, LinkTag::from(()))?;
   /// Done
   Ok(eh)
}


///
#[hdk_extern]
pub fn publish_MembraneCrossedClaim(claim: MembraneCrossedClaim) -> ExternResult<EntryHash> {
   /* Checks */
   let _membrane: Membrane = zome_utils::get_typed_from_eh(claim.membrane_eh.clone())?;
   /// Create Entry
   let _ah = create_entry(MembranesEntry::MembraneCrossedClaim(claim.clone()))?;
   let eh = hash_entry(claim.clone())?;
   /// Create Link from subject
   let _lah = create_link(claim.subject, eh.clone(), MembranesLinkType::MembranePassport, LinkTag::from(()))?;
   /// Done
   Ok(eh)
}