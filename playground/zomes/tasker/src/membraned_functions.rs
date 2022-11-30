use hdk::prelude::*;
use hdk::prelude::holo_hash::{ActionHashB64};
use zome_utils::get_typed_from_ah;
use membranes_types::{MembraneInput, ClaimRoleInput, HasRoleInput, Membrane, MembraneRole, RoleClaim};
use tasker_model::*;
//use crate::basic_functions::lock_task_list;
use crate::call_membranes_zome;
use crate::holo_hash::{AgentPubKeyB64, EntryHashB64};


//#[hdk_extern]
pub fn lock_task_list(list_eh: EntryHash, role_claim_eh: EntryHash) -> ExternResult<ActionHash> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   debug!("lock_task_list() CALLED");
   let anchor_eh = Path::from("locked")
      .path_entry_hash()
      .expect("completed path should hash");
   //let claim_b64: EntryHashB64 = EntryHash.into();
   let link_ah = create_link(
      list_eh,
      anchor_eh,
      TaskerLinkType::Locked,
      LinkTag::from(role_claim_eh.get_raw_39().to_vec()),
   )?;
   Ok(link_ah)
}


///
pub fn am_i_editor() -> ExternResult<Option<(EntryHash, RoleClaim)>> {
   let me = agent_info()?.agent_initial_pubkey;
   let Some(pair): Option<(EntryHash, MembraneRole)> = call_membranes_zome("get_role_with_name", "editor".to_string())?
   else {
      warn!("'editor' role not found");
      return zome_error!("'editor' role not found");
   };
   let maybe_signed_role_claim: Option<SignedActionHashed> = call_membranes_zome("has_role", HasRoleInput {subject: me, role_eh: pair.0})?;
   debug!("am_i_editor() maybe_signed_role_claim: {:?}", maybe_signed_role_claim);
   if maybe_signed_role_claim.is_none() {
      return Ok(None);
   }
   let pair = get_typed_from_ah::<RoleClaim>(maybe_signed_role_claim.unwrap().hashed.hash)?;
   Ok(Some(pair))
}


#[hdk_extern]
fn membraned_lock_task_list(list_eh: EntryHash) -> ExternResult<ActionHash> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   let canEditorPair = am_i_editor()?;
   let Some(pair) =  canEditorPair else {
      return zome_error!("Not allowed to lock task");
   };
   let ah =  lock_task_list(list_eh, pair.0)?;
   Ok(ah)
}