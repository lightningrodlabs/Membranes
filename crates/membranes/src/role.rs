use hdk::prelude::*;
use hdk::prelude::holo_hash::{ActionHashB64, AgentPubKeyB64, EntryHashB64};
use membranes_integrity::MembranesLinkType;
use membranes_types::*;

use crate::{
   constants::*, membrane::*, publish::*,
};
use crate::anchors::{get_all_membranes_details, get_all_roles_details, get_role_by_name};


///
#[hdk_extern]
pub fn get_role_with_name(name: String) -> ExternResult<Option<(EntryHash, MembraneRole)>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   debug!("get_role_with_name() CALLED");
   /// Get Role
   let Some(role) = get_role_by_name(name)?
   else {
      return Ok(None);
   };
   let eh = hash_entry(role.clone())?;
   debug!("get_role_with_name() {:?}", eh);
   Ok(Some((eh, role)))
}


/// Returns Signed RoleClaim Create Action for that Role, if exists
/// Return None if subject does not have any Claim for that Role
#[hdk_extern]
pub fn has_role(input: HasRoleInput) -> ExternResult<Option<SignedActionHashed>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   debug!("has_role()");
   let agent_id: AgentPubKey = input.subject.into();
   let role_eh: EntryHash = input.role_eh.into();
   let link_pairs  = zome_utils::get_typed_from_links::<RoleClaim>(agent_id, MembranesLinkType::RolePassport, None)?;
   for (claim, link) in link_pairs {
      if &claim.role_eh == &role_eh {
         // let eh = hash_entry(claim)?;
         let target: AnyDhtHash = link.target.into_entry_hash().unwrap().into();
         let claim_record = get(target, GetOptions::content())?
            .expect("Should be able to 'get' Claim targeted by link");
         debug!("has_role() DONE signed_action: {:?}", claim_record.signed_action);
         return Ok(Some(claim_record.signed_action))
      }
   }
   debug!("has_role() DONE - None");
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
