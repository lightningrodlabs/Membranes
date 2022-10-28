use hdk::prelude::*;
use hdk::prelude::holo_hash::EntryHashB64;
use membranes_integrity::MembranesLinkType;
use membranes_types::*;
use crate::anchors;


/// Listing all Holochain Path used in this DNA
pub const Roles: &'static str = "Roles";
pub const Membranes: &'static str = "Membranes";
pub const Thresholds: &'static str = "Thresholds";


///
#[hdk_extern]
pub fn get_all_membranes_details(_:()) -> ExternResult<Vec<(EntryHash, Membrane)>> {
   let root_path = Path::from(anchors::Membranes).path_entry_hash()?;
   let result_pairs = zome_utils::get_typed_from_links::<Membrane>(root_path, MembranesLinkType::Membrane, None)?;
   debug!("Membranes found: {}", result_pairs.len());
   let mut result = Vec::new();
   for (typed, _link) in result_pairs {
      let eh = hash_entry(typed.clone())?;
      result.push((eh, typed))
   }
   Ok(result)
}


#[hdk_extern]
pub fn get_all_roles(_ : ()) -> ExternResult<Vec<(EntryHashB64, String)>> {
   // FIXME
   Ok(Vec::new())
}


///
#[hdk_extern]
pub fn get_all_roles_details(_ : ()) -> ExternResult<Vec<(EntryHash, MembraneRole)>> {
   let root_path = Path::from(anchors::Roles).path_entry_hash()?;
   let result_pairs = zome_utils::get_typed_from_links::<MembraneRole>(root_path, MembranesLinkType::Role, None)?;
   debug!("roles found: {}", result_pairs.len());
   let mut result = Vec::new();
   for (typed, _link) in result_pairs {
      let eh = hash_entry(typed.clone())?;
      result.push((eh, typed))
   }
   Ok(result)
}


///
#[hdk_extern]
pub fn get_role_by_name(requested_name: String) -> ExternResult<Option<MembraneRole>> {
   let roles = get_all_roles_details(())?;
   for (_eh, role) in roles {
      if role.name == requested_name {
         return Ok(Some(role));
      }
   }
   Ok(None)
}


///
#[hdk_extern]
pub fn get_all_thresholds_details(_:()) -> ExternResult<Vec<(EntryHash, MembraneThreshold)>> {
   let root_path = Path::from(anchors::Thresholds).path_entry_hash()?;
   let result_pairs = zome_utils::get_typed_from_links::<MembraneThreshold>(root_path, MembranesLinkType::Threshold, None)?;
   debug!("Thresholds found: {}", result_pairs.len());
   let mut result = Vec::new();
   for (typed, _link) in result_pairs {
      let eh = hash_entry(typed.clone())?;
      result.push((eh, typed))
   }
   Ok(result)
}