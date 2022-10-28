import {AgentPubKeyB64, EntryHashB64, ActionHashB64, HoloHashB64} from "@holochain-open-dev/core-types";
import {ActionHash, AgentPubKey, AppEntryType, EntryHash, SignedActionHashed} from "@holochain/client";


export interface MembraneCrossedClaimEntry {
  proof: SignedActionHashed[][], // List of All signed actions required for proving each threshold
  membraneEh: EntryHash, // to a Membrane entry
  subject: AgentPubKey,
}


export interface RoleClaimEntry {
  subject: AgentPubKey,
  membraneIndex: number,
  roleEh: EntryHash, // to Role entry
  membraneClaimEh: EntryHash
}


export interface MembraneRoleEntry {
  name: string,
  privileges: Privilege[],
  enteringMembraneEhs: EntryHash[],
}


export interface MembraneEntry {
  thresholdEhs: EntryHash[]
}


export interface Privilege {
  entryType: AppEntryType,
  crud: string,
}

/** THRESHOLDS */

export type MembraneThresholdEntry = CreateEntryCountThreshold | VouchThreshold


export interface CreateEntryCountThreshold {
  entryType: AppEntryType,
  requiredCount: number,
}


export interface VouchThreshold {
  requiredCount: number,
  byRole: string,
  forRole: string,
}


export interface VouchEntry {
  subject: AgentPubKey,
  forRole: string,
}

