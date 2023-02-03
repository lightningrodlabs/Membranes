import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {CreateEntryCountProxy} from "../bindings/createEntryCount.proxy";
import {CreateEntryCountThreshold, MyAppEntryType} from "../bindings/createEntryCount.types";
import {AgentPubKeyB64, decodeHashFromBase64, EntryHash} from "@holochain/client";


/** */
export interface CreateEntryCountPerspective {
    thresholds: CreateEntryCountThreshold[],
}


/**
 *
 */
export class CreateEntryCountZvm extends ZomeViewModel {

    static readonly ZOME_PROXY = CreateEntryCountProxy;

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
    protected hasChanged(): boolean {
        // TODO
        return true;
    }


    /** */
    async probeAll(): Promise<void> {
        await this.probeThresholds();
    }


    /** */
    async probeThresholds(): Promise<void> {
        this._perspective.thresholds = await this.zomeProxy.getAllThresholdsCreateEntryCount();
        this.notifySubscribers();
    }


    /** -- Methods -- */

    /** */
    async createThreshold(entryType: MyAppEntryType, requiredCount: number): Promise<EntryHash> {
        const typed: CreateEntryCountThreshold = {
            entryType: entryType,
            requiredCount: requiredCount,
        };
        let res = await this.zomeProxy.publishCreateEntryCountThreshold(typed);
        this.probeThresholds();
        return res;
    }


    /** */
    async getCreateCount(agent: AgentPubKeyB64, entryType: MyAppEntryType): Promise<number> {
        return this.zomeProxy.getCreateCount({subject: decodeHashFromBase64(agent), entryType});
    }

}
