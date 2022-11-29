import {EntryHash, AgentPubKey} from "@holochain/client";


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
