use hdk::prelude::*;
use hdk::prelude::holo_hash::{ActionHashB64};
use membranes_types::{ClaimMembraneInput, ClaimRoleInput, HasRoleInput, Membrane, MembraneRole};
use tasker_model::*;
use crate::call_membranes_zome;
use crate::holo_hash::{AgentPubKeyB64, EntryHashB64};


///
#[hdk_extern]
pub fn claim_all_membranes(_: ()) -> ExternResult<usize> {
   /// Get all Membranes
   let membranes: Vec<(EntryHash, Membrane)> = call_membranes_zome("get_all_membranes_details", ())?;
   /// Claim each Membrane
   let mut claim_count = 0;
   for (_eh, membrane) in membranes {
      let membrane_eh = hash_entry(membrane)?;
      let maybe_claim: Option<EntryHashB64> = call_membranes_zome("claim_membrane", ClaimMembraneInput {
         subject: agent_info()?.agent_initial_pubkey.into(),
         membrane_eh: membrane_eh.into(),
      })?;
      debug!("maybe_claimed_membrane: {:?}", maybe_claim);
      if maybe_claim.is_some() {
         claim_count += 1;
      }
   }
   Ok(claim_count)
}


///
#[hdk_extern]
pub fn am_i_editor(_: ()) -> ExternResult<bool> {
   debug!("am_i_editor() CALLED");
   /// Get Role
   let maybe_editorRole: Option<MembraneRole> = call_membranes_zome("get_role_by_name", "editor".to_string())?;
   debug!("am_i_editor() maybe_editorRole: {:?}", maybe_editorRole);
   if maybe_editorRole.is_none() {
      return Ok(false);
   }
   let editorRole = maybe_editorRole.unwrap();
   let editor_b64: EntryHashB64 = hash_entry(editorRole.clone())?.into();
   /// Claim Role
   let maybe_claim: Option<EntryHashB64> = call_membranes_zome("claim_role", ClaimRoleInput {
      subject: agent_info()?.agent_initial_pubkey.into(),
      role_eh: editor_b64.clone(),
      membrane_index: 0,
   })?;
   debug!("am_i_editor() maybe_claim: {:?}", maybe_claim);
   /// Check Role
   let maybe_proof: Option<SignedActionHashed> = call_membranes_zome(
      "has_role",
      HasRoleInput { subject: agent_info()?.agent_initial_pubkey.into(), role_eh: editor_b64.clone() })?;
   debug!("am_i_editor() DONE - {:?}", maybe_proof);
   Ok(maybe_proof.is_some())
}