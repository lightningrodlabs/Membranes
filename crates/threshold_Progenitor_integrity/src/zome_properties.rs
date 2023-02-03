use hdi::prelude::{holo_hash::AgentPubKeyB64, *};

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct ProgenitorThresholdZomeProperties {
   pub progenitors: Vec<AgentPubKeyB64>,
}

impl ProgenitorThresholdZomeProperties {
   pub fn get() -> ExternResult<Self> {
      //debug!("ProgenitorThresholdZomeProperties zome: {:?}", zome_info()?.properties);
      let properties_bytes = dna_info()?.properties;
      // debug!("ProgenitorThresholdZomeProperties dna: {:?}", properties_bytes);
      let props = ProgenitorThresholdZomeProperties::try_from(properties_bytes)
         .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
      Ok(props)
   }
}


///
pub fn is_progenitor(candidat: AgentPubKey) -> ExternResult<bool> {
   let Ok(properties) = ProgenitorThresholdZomeProperties::get()
      else { return Ok(false); };
   let keys = properties.progenitors;
   let b64 = candidat.into();
   //debug!("Progenitors: {:?}\n candidat: {:?}", keys, b64);
   Ok(keys.contains(&b64))
}
