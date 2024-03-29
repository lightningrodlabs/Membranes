use hdk::prelude::*;
use zome_utils::get_all_typed_local;
use membranes_integrity::MembranesLinkType;
use membranes_types::*;
use crate::{anchors, get_all_thresholds_details};

///
#[hdk_extern]
pub fn get_all_thresholds(maybe_type_name: Option<String>) -> ExternResult<Vec<MembraneThreshold>> {
   let res = get_all_thresholds_details(())?;
   let mut thresholds: Vec<MembraneThreshold> = res.into_iter().map(|(_eh, th)| th).collect();
   if let Some(type_name) = maybe_type_name {
      thresholds.retain(|th| {
         th.type_name == type_name
      });
   }
   Ok(thresholds)
}


///
#[hdk_extern]
pub fn get_proof(ah: ActionHash) -> ExternResult<Option<ThresholdReachedProof>> {
   let maybe_typed = zome_utils::get_typed_from_ah::<ThresholdReachedProof>(ah);
   match maybe_typed {
      Ok((_eh, typed)) => Ok(Some(typed)),
      Err(_e) => Ok(None),
   }
}


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
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
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
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   let result_pairs = zome_utils::get_typed_from_links::<MembraneCrossedClaim>(agent_info()?.agent_initial_pubkey, MembranesLinkType::MembranePassport, None)?;
   debug!("myMembraneClaims found: {}", result_pairs.len());
   let mut result = Vec::new();
   for (typed, _link) in result_pairs {
      let eh = hash_entry(typed.clone())?;
      result.push((eh, typed))
   }
   Ok(result)
}