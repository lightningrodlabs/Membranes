use hdk::prelude::*;
use membranes_integrity::MembranesLinkType;
use membranes_types::*;
use crate::anchors;


///
#[hdk_extern]
pub fn get_threshold(eh : EntryHash) -> ExternResult<Option<MembraneThreshold>> {
   let maybe_typed = zome_utils::get_typed_from_eh::<MembraneThreshold>(eh);
   match maybe_typed {
      Ok(typed) => Ok(Some(typed)),
      Err(_e) => Ok(None),
   }
}

///
#[hdk_extern]
pub fn get_membrane(eh : EntryHash) -> ExternResult<Option<Membrane>> {
   let maybe_typed = zome_utils::get_typed_from_eh::<Membrane>(eh);
   match maybe_typed {
      Ok(typed) => Ok(Some(typed)),
      Err(_e) => Ok(None),
   }
}


///
#[hdk_extern]
pub fn get_role(eh : EntryHash) -> ExternResult<Option<MembraneRole>> {
   let maybe_typed = zome_utils::get_typed_from_eh::<MembraneRole>(eh);
   match maybe_typed {
      Ok(typed) => Ok(Some(typed)),
      Err(_e) => Ok(None),
   }
}

///
#[hdk_extern]
pub fn get_membrane_crossed_claim(eh : EntryHash) -> ExternResult<Option<MembraneCrossedClaim>> {
   let maybe_typed = zome_utils::get_typed_from_eh::<MembraneCrossedClaim>(eh);
   match maybe_typed {
      Ok(typed) => Ok(Some(typed)),
      Err(_e) => Ok(None),
   }
}


///
#[hdk_extern]
pub fn get_my_role_claims_details(_ : ()) -> ExternResult<Vec<(EntryHash, RoleClaim)>> {
   let result_pairs = zome_utils::get_typed_from_links::<RoleClaim>(agent_info()?.agent_initial_pubkey, MembranesLinkType::RolePassport, None)?;
   debug!("myRoleClaims found: {}", result_pairs.len());
   let mut result = Vec::new();
   for (typed, _link) in result_pairs {
      let eh = hash_entry(typed.clone())?;
      result.push((eh, typed))
   }
   Ok(result)
}


///
#[hdk_extern]
pub fn get_my_membrane_claims_details(_ : ()) -> ExternResult<Vec<(EntryHash, MembraneCrossedClaim)>> {
   let result_pairs = zome_utils::get_typed_from_links::<MembraneCrossedClaim>(agent_info()?.agent_initial_pubkey, MembranesLinkType::MembranePassport, None)?;
   debug!("myMembraneClaims found: {}", result_pairs.len());
   let mut result = Vec::new();
   for (typed, _link) in result_pairs {
      let eh = hash_entry(typed.clone())?;
      result.push((eh, typed))
   }
   Ok(result)
}