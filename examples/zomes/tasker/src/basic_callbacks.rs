use hdk::prelude::*;
#[allow(unused_imports)]
use tasker_model::*;

use crate::membraned_callbacks::*;

/// Setup initial capabilities
#[hdk_extern]
fn init_caps(_: ()) -> ExternResult<()> {
   let /*mut*/ functions: GrantedFunctions = BTreeSet::new();
   //functions.insert((zome_info()?.name, REMOTE_ENDPOINT.into()));
   create_cap_grant(
      CapGrantEntry {
         tag: "".into(),
         access: ().into(), // empty access converts to unrestricted
         functions,
      }
   )?;
   Ok(())
}


/// Setup
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
   debug!("*** Tasker.init() callback - START");
   init_caps(())?;
   init_anchors(())?;
   init_membranes(())?;
   /// Done
   debug!("*** Tasker.init() callback - DONE");
   Ok(InitCallbackResult::Pass)
}


/// Setup Global Anchors
fn init_anchors(_: ()) -> ExternResult<()> {
   //let typed_path = path.clone().into_typed(ScopedLinkType::try_from(LinkTypes::Tree)?);
   let path1 = Path::from("lists").typed(TaskerLink::TaskLists)?;
   let path2 = Path::from("locked").typed(TaskerLink::Locked)?;
   let path3 = Path::from("completed").typed(TaskerLink::Completed)?;
   path1.ensure()?;
   path2.ensure()?;
   path3.ensure()?;
   Ok(())
}


/// Zome Callback
#[hdk_extern(infallible)]
fn post_commit(_signedActionList: Vec<SignedActionHashed>) {
   // n/a
}


/// Zome Callback
#[hdk_extern]
fn validate(_op: Op) -> ExternResult<ValidateCallbackResult> {
   // fixme
   Ok(ValidateCallbackResult::Valid)
}