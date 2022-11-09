use hdk::prelude::*;
use hdk::prelude::holo_hash::{ActionHashB64, AgentPubKeyB64, EntryHashB64};
use membranes_integrity::MembranesLinkType;
use membranes_types::*;

use crate::{
   constants::*, membrane::*, publish::*,
};
use crate::anchors::{get_all_membranes_details, get_all_roles_details, get_role_by_name};
use crate::claim_membrane::claim_membrane;
use crate::get::get_my_role_claims_details;


///
#[hdk_extern]
pub fn claim_role_with_membrane(input: ClaimRoleInput) -> ExternResult<Option<EntryHashB64>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   let agent_id: AgentPubKey = input.subject.clone();
   let role_eh: EntryHash = input.role_eh.clone();
   /* Check input */
   let role: MembraneRole = zome_utils::get_typed_from_eh(role_eh.clone())?;
   if input.membrane_index >= role.entering_membrane_ehs.len() {
      return zome_error!("Invalid membrane index for role {:?}: {}", input.role_eh, input.membrane_index);
   }
   /// Check membrane claim
   let membrane_eh = role.entering_membrane_ehs[input.membrane_index].clone();
   debug!("Claiming role '{}' with membrane {:?}", role.name, membrane_eh);
   let args = MembraneInput {
      subject: agent_id.clone(),
      membrane_eh: membrane_eh.clone(),
   };
   let mut maybe_membrane_claim_eh = has_crossed_membrane(args.clone())?;
   /// Attempt to cross membrane if not already done
   if maybe_membrane_claim_eh.is_none() {
      maybe_membrane_claim_eh = claim_membrane(args)?;
      if maybe_membrane_claim_eh.is_none() {
         return Ok(None);
      }
   }
   /// Create and publish RoleClaim
   let claim = RoleClaim {
      subject: agent_id.clone(),
      membrane_index: input.membrane_index.clone(),
      role_eh,
      membrane_claim_eh: maybe_membrane_claim_eh.unwrap().into(),
   };
   /// Publish
   let eh = publish_RoleClaim(claim)?;
   /// Done
   Ok(Some(eh.into()))
}


///
#[hdk_extern]
pub fn claim_role_by_name(role_name: String) -> ExternResult<Option<EntryHashB64>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   debug!("claim_role_by_name({}) CALLED", role_name);
   /// Get Role
   let maybe_role: Option<MembraneRole> = get_role_by_name(role_name.clone())?;
   //debug!("claim_role_by_name({}) maybe_role: {:?}", role_name, maybe_role);
   if maybe_role.is_none() {
      warn!("claim_role_by_name({}) role not found.", role_name);
      return Ok(None);
   }
   let role = maybe_role.unwrap();
   let role_eh = hash_entry(role.clone())?;
   /// Claim Role
   let mut index = 0;
   for _membrane_eh in role.entering_membrane_ehs {
      debug!("claim_role_by_name({}) claiming membrane {}", role_name, index);
      let maybe_claim: Option<EntryHashB64> = claim_role_with_membrane(ClaimRoleInput {
         subject: agent_info()?.agent_initial_pubkey.into(),
         role_eh: role_eh.clone(),
         membrane_index: index,
      })?;
      debug!("claim_role_by_name({}) maybe_claim[{}]: {:?}", role_name, index, maybe_claim);
      index += 1;
      if let Some(ehb64) = maybe_claim {
         return Ok(Some(ehb64))
      }
   }
   Ok(None)
}


///
#[hdk_extern]
pub fn claim_all_roles(_: ()) -> ExternResult<usize> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   debug!("claim_all_roles() CALLED");
   /// Get all Membranes
   let roles: Vec<(EntryHash, MembraneRole)> = get_all_roles_details(())?;
   /// Claim each Membrane
   let mut claim_count = 0;
   for (_eh, role) in roles {
      let maybe_claim: Option<EntryHashB64> = claim_role_by_name(role.name.clone())?;
      debug!("maybe_claimed_role: {:?}", maybe_claim);
      if maybe_claim.is_some() {
         claim_count += 1;
      }
   }
   Ok(claim_count)
}