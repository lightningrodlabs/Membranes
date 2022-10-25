use hdk::prelude::*;
use hdk::prelude::holo_hash::AgentPubKeyB64;
#[allow(unused_imports)]
use membranes_model::*;


use crate::{
   constants::*,
};


///
#[hdk_extern]
pub fn publish_vouch(vouch: Vouch) -> ExternResult<ActionHash> {
   let role: MembraneRole = zome_utils::get_typed_from_eh(vouch.for_role_eh.clone())?;
   let ah = create_entry(MembranesEntry::Vouch(vouch.clone()))?;
   let _lah = create_link(vouch.subject, ah.clone(), LinkKind::Vouch, LinkTag::from(role.name.into_bytes()))?;
   /// Done
   Ok(ah)
}


#[hdk_extern]
pub fn publish_threshold(threshold: MembraneThreshold) -> ExternResult<ActionHash> {
   let ah = match threshold {
      MembraneThreshold::CreateEntryCount(th) => {
         publish_createEntryCountThreshold(th)?
      },
      MembraneThreshold::Vouch(th) => {
         publish_vouchThreshold(th)?
      },
   };
   /// Done
   Ok(ah)
}


///
pub fn publish_vouchThreshold(vouch_threshold: VouchThreshold) -> ExternResult<ActionHash> {
   /// Make sure role exists
   let _role: MembraneRole = zome_utils::get_typed_from_eh(vouch_threshold.from_role_eh.clone())?;
   /// Create Entry
   let threshold = MembraneThreshold::Vouch(vouch_threshold);
   let ah = create_entry(MembranesEntry::Threshold(threshold))?;
   /// Done
   Ok(ah)
}


///
pub fn publish_createEntryCountThreshold(create_threshold: CreateEntryCountThreshold) -> ExternResult<ActionHash> {
   /// Make sure AppEntryType exists
   /// FIXME
   /// Create Entry
   let threshold = MembraneThreshold::CreateEntryCount(create_threshold);
   let ah = create_entry(MembranesEntry::Threshold(threshold))?;
   /// Done
   Ok(ah)
}


///
#[hdk_extern]
pub fn publish_membrane(membrane: Membrane) -> ExternResult<ActionHash> {
   /* Check all thresholds exists */
   for threshold_eh in membrane.threshold_ehs.clone() {
      let _threshold: MembraneThreshold = zome_utils::get_typed_from_eh(threshold_eh)?;
   }
   /// Create Entry
   let ah = create_entry(MembranesEntry::Membrane(membrane))?;
   /// Done
   Ok(ah)
}


///
#[hdk_extern]
pub fn publish_role(role: MembraneRole) -> ExternResult<ActionHash> {
   /* Check all thresholds exists */
   for membrane_eh in role.entering_membrane_ehs.clone() {
      let _typed: Membrane = zome_utils::get_typed_from_eh(membrane_eh)?;
   }
   /// Create Entry
   let ah = create_entry(MembranesEntry::Role(role))?;
   /// Done
   Ok(ah)
}


///
#[hdk_extern]
pub fn publish_RoleClaim(claim: RoleClaim) -> ExternResult<ActionHash> {
   /* Input Checks */
   let _role: MembraneRole = zome_utils::get_typed_from_eh(claim.role_eh.clone())?;
   let _membrane_claim: MembraneCrossedClaim = zome_utils::get_typed_from_eh(claim.membrane_claim_eh.clone())?;
   /// Create Entry
   let ah = create_entry(MembranesEntry::RoleClaim(claim.clone()))?;
   //let eh = hash_entry(claim.clone())?;
   /// Create Link from subject
   let _lah = create_link(claim.subject, ah.clone(), LinkKind::RolePassport, LinkTag::from(()))?;
   /// Done
   Ok(ah)
}


///
#[hdk_extern]
pub fn publish_MembraneCrossedClaim(claim: MembraneCrossedClaim) -> ExternResult<ActionHash> {
   /* Checks */
   let _membrane: Membrane = zome_utils::get_typed_from_eh(claim.membrane_eh.clone())?;
   /// Create Entry
   let ah = create_entry(MembranesEntry::MembraneCrossedClaim(claim.clone()))?;
   let eh = hash_entry(claim.clone())?;
   /// Create Link from subject
   let _lah = create_link(claim.subject, eh, LinkKind::MembranePassport, LinkTag::from(()))?;
   /// Done
   Ok(ah)
}