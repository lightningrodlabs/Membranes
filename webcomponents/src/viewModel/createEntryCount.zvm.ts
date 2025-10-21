import {AgentId, ZomeViewModel} from "@ddd-qc/lit-happ";
import {CreateEntryCountProxy} from "../bindings/createEntryCount.proxy";
import {CreateEntryCountThreshold, MyAppEntryType} from "../bindings/createEntryCount.types";
import {EntryHash} from "@holochain/client";


/** */
export interface CreateEntryCountPerspective {
    thresholds: CreateEntryCountThreshold[],
}


/** */
export class CreateEntryCountZvm extends ZomeViewModel {

    static override readonly ZOME_PROXY = CreateEntryCountProxy;

    get zomeProxy(): CreateEntryCountProxy {
        return this._zomeProxy as CreateEntryCountProxy;
    }


    /** -- ViewModel -- */

    private _perspective: CreateEntryCountPerspective = {thresholds: []}


    /* */
    get perspective(): CreateEntryCountPerspective {
        return this._perspective;
    }


    /* */
    protected override hasChanged(): boolean {
        // TODO
        return true;
    }


    /** */
    override async probeAllInner(): Promise<void> {
        await this.probeThresholds();
    }


    /** */
    async probeThresholds(): Promise<void> {
        this._perspective.thresholds = await this.zomeProxy.getAllThresholdsCreateEntryCount();
        console.log("probeThresholds()", this._perspective.thresholds);
        this.notifySubscribers();
    }


    /** -- Methods -- */

    /** */
    async createThreshold(entryType: MyAppEntryType, requiredCount: number): Promise<EntryHash> {
        console.log("createThreshold()", entryType);
        const typed: CreateEntryCountThreshold = {
            entryType: entryType,
            requiredCount: requiredCount,
        };
        let res = await this.zomeProxy.publishCreateEntryCountThreshold(typed);
        await this.probeThresholds();
        return res;
    }


    /** */
    async getCreateCount(agent: AgentId, entryType: MyAppEntryType): Promise<number> {
        return this.zomeProxy.getCreateCount({subject: agent.hash, entryType});
    }

}
