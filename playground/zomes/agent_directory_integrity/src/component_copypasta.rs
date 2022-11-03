use hdi::prelude::*;

#[derive(
Clone, PartialEq, Debug, Default, serde::Deserialize, serde::Serialize, SerializedBytes,
)]
#[repr(transparent)]
pub struct Component(#[serde(with = "serde_bytes")] Vec<u8>);

impl Component {
   pub fn new(v: Vec<u8>) -> Self {
      Self(v)
   }
}

/// Wrap bytes.
impl From<Vec<u8>> for Component {
   fn from(v: Vec<u8>) -> Self {
      Self(v)
   }
}

/// Access bytes.
impl AsRef<[u8]> for Component {
   fn as_ref(&self) -> &[u8] {
      self.0.as_ref()
   }
}

/// Unwrap bytes.
impl From<Component> for Vec<u8> {
   fn from(component: Component) -> Self {
      component.0
   }
}
