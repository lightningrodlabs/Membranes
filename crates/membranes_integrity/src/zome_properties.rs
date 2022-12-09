use hdi::prelude::{holo_hash::AgentPubKeyB64, *};

#[derive(Serialize, Deserialize, SerializedBytes, Debug, Clone)]
pub struct MembraneZomeProperties {
   pub progenitors: Vec<AgentPubKeyB64>,
}

impl MembraneZomeProperties {
   pub fn get() -> ExternResult<Self> {
      let properties = zome_info()?.properties;
      debug!("MembraneZomeProperties: {:?}", properties);
      let props = MembraneZomeProperties::try_from(properties)
         .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
      Ok(props)
   }
}

pub fn is_progenitor(candidat: AgentPubKey) -> ExternResult<bool> {
   let keys = MembraneZomeProperties::get()?.progenitors;
   Ok(keys.contains(&candidat.into()))
}
