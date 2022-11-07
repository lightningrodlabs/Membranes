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


/// Register this agent (during zome init).
fn register_self() -> ExternResult<()> {
   let agent_address = agent_info()?.agent_initial_pubkey;
   /// Avoid duplicate linking if already registered
   if Ok(true) == key_to_path(&agent_address).exists() {
      return Ok(());
   }
   /// Not already registered. Wire up paths & (implicitly) link them
   let agent_path = key_to_path(&agent_address);
   agent_path.ensure()?;
   debug!("*** registered_self() agent_path: {:?}", agent_path);
   /// Done
   Ok(())
}
