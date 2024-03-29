use hdk::prelude::*;
use hdk::prelude::holo_hash::EntryHashB64;
//use hdk::prelude::holo_hash::AgentPubKeyB64;
#[allow(unused_imports)]
use membranes_types::*;
use membranes_integrity::*;

use crate::{constants::*, anchors};
use crate::anchors::get_role_by_name;
use crate::get::{get_my_membrane_claims_details, get_my_role_claims_details};


#[hdk_extern]
pub fn publish_threshold(threshold: MembraneThreshold) -> ExternResult<EntryHash> {
   debug!("publish_threshold() called: {:?}", threshold);
   /// Make sure AppEntryDef exists
   /// FIXME
   /// Create Entry
   let _ah = create_entry(MembranesEntry::Threshold(threshold.clone()))?;
   let eh = hash_entry(threshold.clone())?;
   /// Add to Index
   let root_path = Path::from(anchors::Thresholds).path_entry_hash()?;
   let _lah = create_link(root_path, eh.clone(), MembranesLinkType::Threshold, LinkTag::from(()))?;
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
   /* Check input */
   let _role: MembraneRole = zome_utils::get_typed_from_eh(claim.role_eh.clone())?;
   let _membrane_claim: MembraneCrossedClaim = zome_utils::get_typed_from_eh(claim.membrane_claim_eh.clone())?;
   /// Must not already have Claimed Role
   let new_eh = hash_entry(claim.clone())?;
   let my_role_claims = get_my_role_claims_details(())?;
   for (eh, _role_claim) in my_role_claims {
      if new_eh == eh {
         return Ok(eh);
      }
   }
   /// Publish Entry
   let _ah = create_entry(MembranesEntry::RoleClaim(claim.clone()))?;
   /// Create Link from subject
   let _lah = create_link(claim.subject, new_eh.clone(), MembranesLinkType::RolePassport, LinkTag::from(()))?;
   /// Done
   Ok(new_eh)
}


///
#[hdk_extern]
pub fn publish_MembraneCrossedClaim(claim: MembraneCrossedClaim) -> ExternResult<EntryHash> {
   /* Check input */
   let _membrane: Membrane = zome_utils::get_typed_from_eh(claim.membrane_eh.clone())?;
   /// Must not already have Claimed Role
   let new_eh = hash_entry(claim.clone())?;
   let my_claims = get_my_membrane_claims_details(())?;
   for (eh, _role_claim) in my_claims {
      if new_eh == eh {
         return Ok(eh);
      }
   }
   /// Publish Entry
   let _ah = create_entry(MembranesEntry::MembraneCrossedClaim(claim.clone()))?;
   /// Create Link from subject
   let _lah = create_link(claim.subject, new_eh.clone(), MembranesLinkType::MembranePassport, LinkTag::from(()))?;
   /// Done
   Ok(new_eh)
}