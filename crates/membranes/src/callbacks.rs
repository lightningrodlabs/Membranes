use hdk::prelude::*;
//use hdk::hash_path::path::Component;
#[allow(unused_imports)]
use membranes_integrity::*;
use membranes_types::MembraneThreshold;
use crate::*;

/// Zome Callback
#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
   debug!("*** Membranes.init() callback - START");
   /// Properties
   init_properties()?;
   /// Setup initial capabilities
   init_capabilities()?;
   /// Setup paths
   init_anchors()?;
   /// Done
   debug!("*** Membranes.init() callback - DONE");
   Ok(InitCallbackResult::Pass)
}


/// Initialize paths
fn init_anchors() -> ExternResult<InitCallbackResult> {
   let root_path = Path::from(anchors::Roles);
   let roles_path = root_path.clone().typed(MembranesLinkType::Role)?;
   roles_path.ensure()?;
   let root_path = Path::from(anchors::Membranes);
   let membranes_path = root_path.clone().typed(MembranesLinkType::Membrane)?;
   membranes_path.ensure()?;
   let root_path = Path::from(anchors::Thresholds);
   let thresholds_path = root_path.clone().typed(MembranesLinkType::Threshold)?;
   thresholds_path.ensure()?;
   Ok(InitCallbackResult::Pass)
}


/// Validate DNA properties
fn init_properties() -> ExternResult<InitCallbackResult> {
   let maybe_membrane_zome_properties = MembraneZomeProperties::get();
   debug!("maybe_membrane_zome_properties = {:?}", maybe_membrane_zome_properties);

   /// Create progenitor threshold if properties is set
   //if let Ok(props) = &maybe_membrane_zome_properties {
      //let _progenitors = &props.progenitors;
      // FIXME make sure they are valid key hashs.

      /// Create threshold Entry
      let _ah = create_entry(MembranesEntry::Threshold(MembraneThreshold::Progenitor))?;
      let _eh = hash_entry(MembraneThreshold::Progenitor)?;
      // Add to Index
      //let root_path = Path::from(anchors::Thresholds).path_entry_hash()?;
      //let _lah = create_link(root_path, eh.clone(), MembranesLinkType::Threshold, LinkTag::from("Progenitor".to_string().into_bytes()))?;
   //}
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