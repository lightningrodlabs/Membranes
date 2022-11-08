#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]
#![allow(unused_imports)]

mod get;
mod basic_callbacks;
mod membraned_callbacks;

#[macro_use]
extern crate zome_utils;

mod basic_functions;
mod membraned_functions;

use hdk::prelude::*;
use zome_utils::call_self_cell;


///
pub fn call_membranes_zome<I, O>(fn_name: &str, payload: I) -> ExternResult<O>
where
   I: serde::Serialize + std::fmt::Debug,
   O: serde::de::DeserializeOwned + std::fmt::Debug
{
   debug!("call_membranes_zome() - {}()", fn_name);
   return call_self_cell(membranes_types::MEMBRANES_ZOME_NAME, fn_name, payload);
}