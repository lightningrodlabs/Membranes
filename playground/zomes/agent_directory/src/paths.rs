
use hdk::prelude::*;
use hdk::hash_path::path::Component;
#[allow(unused_imports)]
use agent_directory_integrity::*;


pub const AGENT_DIRECTORY_PATH: &str = "registered_agents";


/// Load the well-known base anchor for agent queries.
pub fn get_agent_directory_path() -> Path {
   Path::from(AGENT_DIRECTORY_PATH)
}

/// Load the well-known base anchor for agent queries.
pub fn get_agent_directory_typed_path() -> TypedPath {
   get_agent_directory_path()
      .typed(AgentDirectoryLinkType::Agent)
      .expect("Path should be typable")
}



/// Get typed path from an agent's key
pub fn key_to_path(agent_id: &AgentPubKey) -> TypedPath {
   //let path = Path::from(vec![AGENT_DIRECTORY_PATH.into(), Component::from(agent_id.get_raw_39().to_vec())]);
   let raw_agent_id = agent_id.get_raw_39().to_vec();
   let agent_component = Component::from(raw_agent_id);
   let mut path = get_agent_directory_path();
   path.append_component(agent_component);
   return path
      .typed(AgentDirectoryLinkType::Agent)
      .expect("Path should be typable");
}


/// Get agent_key from a path
pub fn path_to_key(agent_path: &Path) -> ExternResult<AgentPubKey> {
   let Some(leaf) = agent_path.leaf() else {
      return Err(wasm_error!(WasmErrorInner::Guest("Path of invalid length".to_string())));
   };
   let agent_key = AgentPubKey::from_raw_39(leaf.as_ref().to_vec())
      .map_err(|_e| { wasm_error!(WasmErrorInner::Guest(format!("Registered agent_path has invalid AgentPubKey {:?}", leaf))) });
   agent_key
}
