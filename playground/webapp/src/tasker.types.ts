import {AgentPubKeyB64, EntryHashB64, ActionHashB64, HoloHashB64} from "@holochain-open-dev/core-types";
import {ActionHash, AgentPubKey} from "@holochain/client";

import * as base64 from "byte-base64";


// export interface HoloHashed<T> {
//   hash: HoloHashB64;
//   content: T;
// }

// export interface DnaProperties {
//   startTime: number,
// }

export interface TaskListEntry {
  title: string,
}


export interface TaskItemEntry {
  title: string,
  assignee: AgentPubKey,
  list_ah: ActionHash,
}


export interface TaskItem {
  entry: TaskItemEntry,
  isCompleted: boolean,
}

export interface TaskList {
  title: string,
  isLocked: boolean,
  items: [ActionHashB64, TaskItem][],
}


export interface CreateTaskItemInput {
  title: string,
  assignee: AgentPubKeyB64,
  list_ah: ActionHashB64,
}


export interface ReassignTaskInput {
  task_ah: ActionHashB64,
  assignee: AgentPubKeyB64,
}



/** Convert hash (Uint8Array) to/from base64 string */
export function htos(u8array: Uint8Array): string {
  if (!u8array) {
    console.error("htos() argument is undefined")
  }
  return base64.bytesToBase64(u8array)
}
export function stoh(str: string): Uint8Array {
  if (!str) {
    console.error("stoh() argument is undefined")
  }
  return base64.base64ToBytes(str)
}



// export interface PublishCallback {
//   (snapshot: SnapshotEntry, cbData?: any): void;
// }



// export type Signal =
//   | {
//     maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: { type: "Ping", content: AgentPubKeyB64 }
//   }
//   | {
//   maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: { type: "Pong", content: AgentPubKeyB64 }
// }
//   | {
//   maybeSpaceHash: EntryHashB64 | null, from: AgentPubKeyB64, message: {type: "NewSnapshot", content: EntryHashB64}
// }

