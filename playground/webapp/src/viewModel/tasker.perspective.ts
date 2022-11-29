import {Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";
import {TaskItemEntry, TaskListEntry} from "./tasker.bindings";


/** */
export interface TaskItem {
    entry: TaskItemEntry,
    isCompleted: boolean,
}
/** */
export interface TaskList {
    title: string,
    isLocked: boolean,
    items: [EntryHashB64, TaskItem][],
}


/** */
export interface TaskerPerspective {
    /** EntryHash -> TaskList */
    taskLists: Dictionary<TaskList>,
    taskListEntries: Dictionary<TaskListEntry>,
    /** EntryHash -> TaskItem */
    taskItems: Dictionary<TaskItem>,
    myRoles: string[]
}

export const emptyTaskerPerspective: TaskerPerspective = {
    taskLists: {},
    taskListEntries: {},
    taskItems: {},
    myRoles: [],
}

