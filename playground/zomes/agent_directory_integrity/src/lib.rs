#![allow(non_upper_case_globals)]
#![allow(unused_doc_comments)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

/// Copied from hdk/hash_path
/// TODO: Remove this once hdk/hash_path is moved to hdi and can be imported normally
mod component_copypasta;
use crate::component_copypasta::Component;

use hdi::prelude::*;



/// List of all Link kinds handled by this Zome
#[hdk_link_types]
pub enum AgentDirectoryLinkType {
   Agent,
}


///
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
   match op {
      Op::StoreRecord ( _ ) => Ok(ValidateCallbackResult::Valid),
      Op::StoreEntry { .. } => Ok(ValidateCallbackResult::Valid),
      Op::RegisterCreateLink (registered_create_link) => {
         let (create, signature) = registered_create_link.create_link.into_inner();
         let link_type = AgentDirectoryLinkType::try_from(ScopedLinkType {
            zome_id: create.zome_id,
            zome_type: create.link_type,
         })?;
         if link_type == AgentDirectoryLinkType::Agent {
            return validate_agent_link(create, signature);
         } else {
            Ok(ValidateCallbackResult::Invalid("Unknown link type".to_string()))
         }
      }
      Op::RegisterDeleteLink (_)=> Ok(ValidateCallbackResult::Invalid("Deleting links isn't allowed".to_string())),
      Op::RegisterUpdate { .. } => Ok(ValidateCallbackResult::Invalid("Updating entries isn't allowed".to_string())),
      Op::RegisterDelete { .. } => Ok(ValidateCallbackResult::Invalid("Deleting entries isn't allowed".to_string())),
      Op::RegisterAgentActivity { .. } => Ok(ValidateCallbackResult::Valid),
   }
}


/// Checks Agent Link is created by self
pub fn validate_agent_link(create_link: HoloHashed<CreateLink>, signature: Signature) -> ExternResult<ValidateCallbackResult>  {
   //debug!("validate_agent_link(): {:?}", create_link);
   /// Retrieve Path::Component from LinkTag
   let tag_bytes = create_link.tag.clone().into_inner();
   let unsafe_bytes = UnsafeBytes::from(tag_bytes.clone());
   let ser_bytes = SerializedBytes::from(unsafe_bytes);
   let maybe_component = Component::try_from(ser_bytes);
   let Ok(component) = maybe_component else {
      return Ok(ValidateCallbackResult::Invalid("Failed to convert LinkTag to Component".to_string()))
   };
   /// Retrieve AgentPubKey from Component
   let maybe_agent_key = AgentPubKey::from_raw_39(component.as_ref().to_vec());
   //debug!("validate_agent_link(): agent_key = {:?}", maybe_agent_key);
   /// Check key in LinkTag matches author and action signature
   let Ok(agent_key) = maybe_agent_key else {
      /// TODO: Path root is also of type Agent but does not have the LinkTag, so skip for now.
      // return Ok(ValidateCallbackResult::Invalid("Failed to convert Component to AgentPubKey".to_string()))
      return Ok(ValidateCallbackResult::Valid);
   };
   if agent_key != create_link.author {
      return Ok(ValidateCallbackResult::Invalid("Link Author and Tag don't match".to_string()))
   }
   let success = verify_signature(agent_key, signature, Action::CreateLink(create_link.content))?;
   Ok(if !success {
      ValidateCallbackResult::Invalid("Failed to verify signature".to_string())
   } else {
      ValidateCallbackResult::Valid
   })
}