use hdi::prelude::*;

/// List of all Link kinds handled by this Zome
#[hdk_link_types]
pub enum LinkKind {
   Vouch,
   Passport,
}