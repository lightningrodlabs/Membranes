use hdk::prelude::*;
use hdk::prelude::holo_hash::EntryHashB64;
use membranes_integrity::MembranesLinkType;
use membranes_types::*;
use crate::path_kind;


/// Listing all Holochain Path used in this DNA
pub const Roles: &'static str = "Roles";
pub const Membranes: &'static str = "Membranes";
pub const Thresholds: &'static str = "Thresholds";


#[hdk_extern]
pub fn get_all_roles(_ : ()) -> ExternResult<Vec<(EntryHashB64, String)>> {
   // FIXME
   Ok(Vec::new())
}


///
pub fn get_all_roles_details() -> ExternResult<Vec<MembraneRole>> {
   let root_path = Path::from(path_kind::Roles).path_entry_hash()?;
   let result_pairs = zome_utils::get_typed_from_links(root_path, MembranesLinkType::Role, None)?;
   let mut result = Vec::new();
   for (role, _link) in result_pairs {
      //let eh = hash_entry(role.clone())?;
      result.push(role);
   }
   Ok(result)
}


///
pub fn get_role(requested_name: String) -> ExternResult<Option<MembraneRole>> {
   let roles = get_all_roles_details()?;
   for role in roles {
      if role.name == requested_name {
         return Ok(Some(role));
      }
   }
   Ok(None)
}
