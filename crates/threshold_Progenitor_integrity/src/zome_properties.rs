use hdi::prelude::{holo_hash::AgentPubKeyB64, *};

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct ProgenitorThresholdZomeProperties {
   pub progenitors: Vec<AgentPubKeyB64>,
}

impl ProgenitorThresholdZomeProperties {
   pub fn get() -> ExternResult<Self> {
      //debug!("MembraneZomeProperties zome: {:?}", zome_info()?.properties);
      let properties = dna_info()?.properties;
      //debug!("MembraneZomeProperties dna: {:?}", properties);
      let props = ProgenitorThresholdZomeProperties::try_from(properties)
         .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
      Ok(props)
   }
}


///
pub fn is_progenitor(candidat: AgentPubKey) -> ExternResult<bool> {
   let keys = ProgenitorThresholdZomeProperties::get()?.progenitors;
   let b64 = candidat.into();
   //debug!("Progenitors: {:?}\n candidat: {:?}", keys, b64);
   Ok(keys.contains(&b64))
}
