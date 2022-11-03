use hdk::prelude::*;
#[allow(unused_imports)]
use agent_directory_integrity::*;
use crate::*;

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
fn register_self() -> ExternResult<()> {
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


/// Returns true if the given agent ID is a member of the local DNA
fn is_agent_registered(address: &AgentPubKey) -> ExternResult<bool> {
   get_agent_typed_path(address).exists()
}
