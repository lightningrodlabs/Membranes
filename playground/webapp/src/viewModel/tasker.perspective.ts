import {Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";
import {TaskItem, TaskList} from "../bindings/tasker";


/** */
export interface TaskItemMaterialized {
    entry: TaskItem,
    isCompleted: boolean,
}
/** */
export interface TaskListMaterialized {
    title: string,
    isLocked: boolean,
    items: [EntryHashB64, TaskItemMaterialized][],
}


/** */
export interface TaskerPerspective {
    /** EntryHash -> TaskList */
    taskLists: Dictionary<TaskListMaterialized>,
    taskListEntries: Dictionary<TaskList>,
    /** EntryHash -> TaskItem */
    taskItems: Dictionary<TaskItemMaterialized>,
    myRoles: string[],
}


