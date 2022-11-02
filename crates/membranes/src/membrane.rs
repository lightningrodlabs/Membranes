use hdk::prelude::*;
use hdk::prelude::holo_hash::{ActionHashB64, AgentPubKeyB64, EntryHashB64};
#[allow(unused_imports)]
use membranes_integrity::*;
use membranes_types::*;

use crate::{anchors::*, constants::*};
use crate::anchors::get_role_by_name;
use crate::publish::{publish_MembraneCrossedClaim};
use crate::role::{has_role};



/// Returns entry hash of MembraneCrossedClaim for that Membrane, if exists
/// Return None if subject does not have a claim
#[hdk_extern]
pub fn has_crossed_membrane(input: MembraneInput) -> ExternResult<Option<EntryHashB64>> {
   std::panic::set_hook(Box::new(zome_utils::zome_panic_hook));
   let agent_id: AgentPubKey = input.subject.into();
   let membrane_eh: EntryHash = input.membrane_eh.into();
   let link_pairs  = zome_utils::get_typed_from_links::<MembraneCrossedClaim>(agent_id, MembranesLinkType::MembranePassport, None)?;
   for (claim, _link) in link_pairs {
      if &claim.membrane_eh == &membrane_eh {
         let eh = hash_entry(claim)?;
         return Ok(Some(eh.into()))
      }
   }
   Ok(None)
}

