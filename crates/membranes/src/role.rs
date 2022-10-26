use hdk::prelude::*;
use hdk::prelude::holo_hash::{ActionHashB64, AgentPubKeyB64, EntryHashB64};
use membranes_integrity::MembranesLinkType;
use membranes_types::*;

use crate::{
   constants::*, membrane::*, publish::*,
};


/// Returns Signed RoleClaim Create Action for that Role, if exists
/// Return None if subject does not have any Claim for that Role
#[hdk_extern]
pub fn has_role(input: HasRoleInput) -> ExternResult<Option<SignedActionHashed>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   let agent_id: AgentPubKey = input.subject.into();
   let role_eh: EntryHash = input.role_eh.into();
   let link_pairs  = zome_utils::get_typed_from_links::<RoleClaim>(agent_id, MembranesLinkType::RolePassport, None)?;
   for (claim, link) in link_pairs {
      if &claim.role_eh == &role_eh {
         // let eh = hash_entry(claim)?;
         let claim_record = get(link.target, GetOptions::content())?
            .expect("Should be able to 'get' Claim targeted by link");
         return Ok(Some(claim_record.signed_action))
      }
   }
   Ok(None)
}


/// Remote call to ask agent if it has a certain role
/// Returns entry hash of membraneCrossingProof for that Role, if exists
/// Return None if subject does not have that role
#[hdk_extern]
pub fn do_i_have_role(_role_eh: EntryHashB64) -> ExternResult<Option<EntryHashB64>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   // FIXME: Check my local source-chain for a PrivateRoleClaim for that Role
   Ok(None)
}


///
#[hdk_extern]
pub fn claim_role(input: ClaimRoleInput) -> ExternResult<Option<EntryHashB64>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   let agent_id: AgentPubKey = input.subject.clone().into();
   let role_eh: EntryHash = input.role_eh.clone().into();
   /* Check input */
   let role: MembraneRole = zome_utils::get_typed_from_eh(role_eh.clone())?;
   if input.membrane_index >= role.entering_membrane_ehs.len() {
      // let msg = format!("Invalid membrane index for role {:?}: {}", input.role_eh, input.membrane_index);
      // return Err(wasm_error!(WasmErrorInner::Guest(msg)));
      return zome_error!("Invalid membrane index for role {:?}: {}", input.role_eh, input.membrane_index);
   }
   /// Check membrane claim
   let maybe_membrane_claim_eh = has_crossed_membrane(HasCrossedMembraneInput {
      subject: agent_id.clone().into(),
      membrane_eh: role.entering_membrane_ehs[input.membrane_index].clone().into(),
   })?;
   if maybe_membrane_claim_eh.is_none() {
      return Ok(None);
   }
   /// Create and publish RoleClaim
   let claim = RoleClaim {
      subject: agent_id.clone(),
      membrane_index: input.membrane_index.clone(),
      role_eh: role_eh,
      membrane_claim_eh: maybe_membrane_claim_eh.unwrap().into(),
   };
   let eh = publish_RoleClaim(claim)?;
   /// Done
    Ok(Some(eh.into()))
}