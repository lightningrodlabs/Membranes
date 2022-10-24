import {AgentPubKeyB64, EntryHashB64, ActionHashB64, HoloHashB64} from "@holochain-open-dev/core-types";
//import { createContext, Context } from "@holochain-open-dev/context";
import { createContext } from '@lit-labs/context';
import { HolochainStore } from "./holochain.store";

export const taskerContext = createContext<HolochainStore>('tasker/service');

export type Dictionary<T> = { [key: string]: T };


export interface HoloHashed<T> {
  hash: HoloHashB64;
  content: T;
}

// export interface DnaProperties {
//   startTime: number,
// }

export interface TaskListEntry {
  title: string,
}


export interface TaskItemEntry {
  title: string,
  assignee: AgentPubKeyB64,
  list_ah: ActionHashB64,
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

