#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

mod ui;
mod basic_callbacks;
//mod basic_functions;

mod membraned_callbacks;
mod membraned_functions;


use hdk::prelude::*;

///
pub fn call_membranes_zome<I>(fn_name: &str, payload: I) -> ExternResult<()>
where
   I: serde::Serialize + std::fmt::Debug
{
   // TODO check fn_name exists
   let res = call(
      CallTargetCell::Local,
      membranes_types::MEMBRANES_ZOME_NAME,
      fn_name.to_string().into(),
      None,
      payload,
   )?;
   let _: () = zome_utils::decode_response(res)?;
   Ok(())
}