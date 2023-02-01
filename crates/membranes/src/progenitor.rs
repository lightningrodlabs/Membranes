

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


/// Proof of vouchThreshold is empty SAH
/// Returns None if claim failed.
fn claim_progenitorThreshold(subject: AgentPubKey) -> ExternResult<Option<Vec<SignedActionHashed>>> {
   let maybe = is_progenitor(subject);
   let Ok(is_progenitor) = maybe
      else { return Ok(None) };
   if is_progenitor {
      return Ok(Some(vec![]));
   }
   Ok(None)
}
