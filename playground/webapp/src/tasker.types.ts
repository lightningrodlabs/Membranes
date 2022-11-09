import {EntryHash, AgentPubKey} from "@holochain/client";

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
  listEh: EntryHash,
}


export interface CreateTaskItemInput {
  title: string,
  assignee: AgentPubKey,
  listEh: EntryHash,
}


export interface ReassignTaskInput {
  taskEh: EntryHash,
  assignee: AgentPubKey,
}



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

