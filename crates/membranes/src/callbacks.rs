use hdk::prelude::*;
//use hdk::hash_path::path::Component;
#[allow(unused_imports)]
use membranes_model::*;
use crate::*;

/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
   debug!("*** init() callback START");
   /// Properties
   init_properties()?;
   /// Setup initial capabilities
   init_capabilities()?;
   /// Done
   debug!("*** init() callback DONE");
   Ok(InitCallbackResult::Pass)
}


/// Validate DNA properties
fn init_properties() -> ExternResult<InitCallbackResult> {
   // let maybe_place_properties = get_properties(());
   // //debug!("maybe_place_properties = {:?}", maybe_place_properties);
   // if let Err(e) = &maybe_place_properties {
   //    error!("Failed parsing DNA properties: {:?}", e);
   // }
   // let place_properties = maybe_place_properties.unwrap();
   // debug!("*** init() place_properties: {:?}", place_properties);
   // assert!(place_properties.bucket_size_sec < MAX_BUCKET_SIZE_SEC);
   Ok(InitCallbackResult::Pass)
}


///
fn init_capabilities() -> ExternResult<InitCallbackResult> {
   let mut functions: GrantedFunctions = BTreeSet::new();
   functions.insert((zome_info()?.name, REMOTE_ENDPOINT.into()));
   //functions.insert((zome_info()?.name, "get_enc_key".into()));
   create_cap_grant(
      CapGrantEntry {
         tag: "".into(),
         access: ().into(), // empty access converts to unrestricted
         functions,
      }
   )?;
   Ok(InitCallbackResult::Pass)
}