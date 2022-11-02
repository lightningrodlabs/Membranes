#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]

mod ui;
mod basic_callbacks;
mod membraned_callbacks;

#[macro_use]
extern crate zome_utils;

mod basic_functions;
mod membraned_functions;

use hdk::prelude::*;

///
pub fn call_membranes_zome<I, O>(fn_name: &str, payload: I) -> ExternResult<O>
where
   I: serde::Serialize + std::fmt::Debug,
   O: serde::de::DeserializeOwned + std::fmt::Debug
{
   // TODO check fn_name exists
   let res = call(
      CallTargetCell::Local,
      membranes_types::MEMBRANES_ZOME_NAME,
      fn_name.to_string().into(),
      None,
      payload,
   )?;
   debug!("call_membranes_zome() response for {}(): {:?}", fn_name, res);
   let output: O = zome_utils::decode_response(res)?;
   Ok(output)
}