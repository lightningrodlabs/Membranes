use hdk::prelude::*;
#[allow(unused_imports)]
use agent_directory_integrity::*;
use crate::*;

/// Returns the addresses of all agents who have accessed the DNA
#[hdk_extern]
pub fn get_registered_agents(_:()) -> ExternResult<Vec<AgentPubKey>> {
   //debug!("*** get_registered_agents() called !");
   let child_links = get_agent_directory_typed_path().children_paths()?;
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
