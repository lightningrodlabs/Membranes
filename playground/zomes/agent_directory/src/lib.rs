use hdk::prelude::*;
use hdk::hash_path::path::Component;
use hdk::prelude::holo_hash::AgentPubKeyB64;

use agent_directory_integrity::*;


pub const AGENT_DIRECTORY_PATH: &str = "registered_agents";


/// Returns the addresses of all agents who have accessed the DNA
#[hdk_extern]
pub fn get_registered_agents(_:()) -> ExternResult<Vec<AgentPubKey>> {
   //debug!("*** get_registered_agents() called !");
   let child_links = get_directory_typed_path().children_paths()?;
   //debug!("*** get_registered_agents() child_links.len = {}", child_links.len());
   let agent_keys = child_links.iter()
                               .map(|typed_link| {
                                  //debug!("Agent path found: {:?}", typed_link);
                                  path_to_key(&typed_link.path)
                               })
                               .filter_map(Result::ok)
                               //.map(|key| key.into())
                               .collect();
   Ok(agent_keys)
}


/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
   debug!("*** AgentDirectory.init() callback - START");
   let res = register_self();
   if let Err(e) = res {
      let msg = format!("Failed registering agent: {:?}", e);
      error!(msg);
      return Ok(InitCallbackResult::Fail(msg));
   }
   debug!("*** AgentDirectory.init() callback - END");
   Ok(InitCallbackResult::Pass)
}


/// Must be called at zome init time.
pub fn register_self() -> ExternResult<()> {
   let agent_address = agent_info()?.agent_initial_pubkey;
   /// Avoid duplicate linking if already registered
   if Ok(true) == is_agent_registered(&agent_address) {
      return Ok(());
   }
   /// Not already registered- wire up paths & (implicitly) link them
   let agent_path = get_agent_typed_path(&agent_address);
   agent_path.ensure()?;
   debug!("*** registered_self() agent_path: {:?}", agent_path);
   /// Done
   Ok(())
}

/// Load the well-known base anchor for agent queries.
pub fn get_directory_path() -> Path {
   Path::from(AGENT_DIRECTORY_PATH)
}

/// Load the well-known base anchor for agent queries.
pub fn get_directory_typed_path() -> TypedPath {
   get_directory_path()
      .typed(AgentDirectoryLinkType::Agent)
      .expect("Path should be typable")
}



/// Determine path for an individual agent's registration in the DNA
pub fn get_agent_typed_path(agent_id: &AgentPubKey) -> TypedPath {
   //let path = Path::from(vec![AGENT_DIRECTORY_PATH.into(), Component::from(agent_id.get_raw_39().to_vec())]);
   let agent_component = Component::from(agent_id.get_raw_39().to_vec());
   let mut path = get_directory_path();
   path.append_component(agent_component);
   return path.typed(AgentDirectoryLinkType::Agent).expect("Path should be typable");
}



/// Returns true if the given agent ID is a member of the local DNA
pub fn is_agent_registered(address: &AgentPubKey) -> ExternResult<bool> {
   get_agent_typed_path(address).exists()
}

///
fn path_to_key(agent_path: &Path) -> ExternResult<AgentPubKey> {
   // let components: &Vec<Component> = agent_path.as_ref();
   // let last = components.as_slice()
   //    .last()
   //    .ok_or(wasm_error!(WasmErrorInner::Guest("agent registration Path of invalid length".to_string())))?;
   let leaf = agent_path.leaf()
                        .ok_or(wasm_error!(WasmErrorInner::Guest("Registered agent_path of invalid length".to_string())))?;
   let agent_key = AgentPubKey::from_raw_39(leaf.as_ref().to_vec())
      .map_err(|_e| { wasm_error!(WasmErrorInner::Guest(format!("Registered agent_path has invalid AgentPubKey {:?}", leaf))) });
   agent_key
}


// /// Returns the addresses of all agents who have accessed the local DNA
// pub fn get_registered_agents() -> ExternResult<Vec<AgentPubKey>> {
//    let child_links = get_directory_typed_path().children()?;
//    let agent_keys = child_links.iter()
//       .map(|link| {
//          let record = get(link.target.to_owned(), GetOptions::default())?
//             .ok_or(wasm_error!(WasmErrorInner::Guest(format!("Agent registration link invalid: {:?}", link.target))))?;
//          let (_sah, entry) = record.into_inner();
//          let entry = match entry {
//             RecordEntry::Present(e) => Ok(e),
//             _ => Err(wasm_error!(WasmErrorInner::Guest(format!("No entry for registered agent link to {:?}", link.target)))),
//          }?;
//          let child_path = Path::try_from(&entry)?;
//          agent_pubkey_from_trailing_component(&child_path)
//       })
//       .filter_map(Result::ok)
//       .collect();
//    Ok(agent_keys)
// }


// /// Checks for and validates any creation of an agent address path
// pub fn validate_registration_path(validation_data: ValidateData) -> ExternResult<ValidateCallbackResult>  {
//    let element = validation_data.element;
//    let (signed_header, entry) = element.into_inner();
//    let entry = match entry {
//       ElementEntry::Present(e) => e,
//       _ => return Ok(ValidateCallbackResult::Valid),
//    };
//
//    let root_path = get_root_anchor();
//
//    match Path::try_from(&entry) {
//       Ok(any_path) => {
//          // if the path is rooted in the registration anchor, ensure its creator is the signee
//          if any_path.parent() == Some(root_path) {
//             return validate_path_agent_matches(&any_path, &signed_header);
//          }
//
//          Ok(ValidateCallbackResult::Valid)  // not correct type of Path
//       },
//       _ => Ok(ValidateCallbackResult::Valid), // not a Path
//    }
// }
//
//
// /// Ensure that the trailing `Component` of a `Path` matches the `AgentPubKey` of the agent signing some header
// fn validate_path_agent_matches(path_with_agent_suffix: &Path, signed_header: &SignedHeaderHashed) -> ExternResult<ValidateCallbackResult>
// {
//    let written_agent_pubkey = agent_pubkey_from_trailing_component(path_with_agent_suffix)?;
//    verify_signature(written_agent_pubkey, signed_header.signature().to_owned(), signed_header.header())?;
//    Ok(ValidateCallbackResult::Valid)
// }
