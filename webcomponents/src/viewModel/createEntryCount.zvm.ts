import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {CreateEntryCountProxy} from "../bindings/createEntryCount.proxy";
import {MyAppEntryType} from "../bindings/createEntryCount.types";
import {AgentPubKeyB64, decodeHashFromBase64} from "@holochain/client";

/**
 *
 */
export class CreateEntryCountZvm extends ZomeViewModel {

    static readonly ZOME_PROXY = CreateEntryCountProxy;

    get zomeProxy(): CreateEntryCountProxy {
        return this._zomeProxy as CreateEntryCountProxy;
    }


    /** -- ViewModel -- */

    /* */
    get perspective(): {} {
        return {};
    }

    /* */
    protected hasChanged(): boolean {
        // TODO
        return true;
    }


    /** */
    async probeAll(): Promise<void> {
    }


    /** -- Perspective -- */

    private _perspective = {}


    /** -- methods -- */

    // /** */
    // async createCreateEntryCountThreshold(entryType: MyAppEntryType, requiredCount: number): Promise<EntryHash> {
    //     const typed: CreateEntryCountThreshold = {
    //         entryType: entryType,
    //         requiredCount: requiredCount,
    //     };
    //     let res = await this.zomeProxy.publishCreateEntryCountThreshold(typed);
    //     this.probeThresholds();
    //     return res;
    // }


    /** */
    async getCreateCount(agent: AgentPubKeyB64, entryType: MyAppEntryType): Promise<number> {
        return this.zomeProxy.getCreateCount({subject: decodeHashFromBase64(agent), entryType});
    }

}
