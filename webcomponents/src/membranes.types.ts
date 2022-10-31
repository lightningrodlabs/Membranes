import {AgentPubKeyB64, EntryHashB64, ActionHashB64, HoloHashB64} from "@holochain-open-dev/core-types";
import {ActionHash, AgentPubKey, AppEntryType, EntryHash, SignedActionHashed} from "@holochain/client";


///
export interface ThresholdReachedProof {
  thresholdEh: EntryHash,
  signedActions: SignedActionHashed[], // List of All signed actions required for proving a threshold
}

export interface MembraneCrossedClaimEntry {
  proofs: ThresholdReachedProof[],
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

export interface MyAppEntryType {
  id: number,
  zomeId: number,
  isPublic: boolean,
}

export type MembraneThresholdEntry = CreateEntryCountThreshold | VouchThreshold

export enum MembraneThresholdKind {
  CreateEntryCountThreshold,
  VouchThreshold,
}

export interface CreateEntryCountThreshold {
  entryType: MyAppEntryType,
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

