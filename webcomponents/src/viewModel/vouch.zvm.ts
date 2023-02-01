import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {VouchProxy} from "../bindings/vouch.proxy";
import {AgentPubKey, AgentPubKeyB64, decodeHashFromBase64, encodeHashToBase64, EntryHash} from "@holochain/client";
import {MembraneRole} from "../bindings/membranes.types";
import {Vouch} from "../bindings/vouch.types";



export interface TypedVouch {
    subject: AgentPubKeyB64,
    forRole: string,
}


export interface VouchPerspective {
    /** RoleName -> [[emitted],[[received,author]]] */
    myVouches: Record<string, [TypedVouch[], [TypedVouch, AgentPubKeyB64][]]>
}


/**
 *
 */
export class VouchZvm extends ZomeViewModel {

    static readonly ZOME_PROXY = VouchProxy;
    get zomeProxy(): VouchProxy {return this._zomeProxy as VouchProxy;}


    /** -- ViewModel -- */

    /* */
    get perspective(): VouchPerspective{
        return this._perspective;
    }

    /* */
    protected hasChanged(): boolean {
        // TODO
        return true;
    }


    /** */
    async probeAll(): Promise<void> {
        //const roleEntries = await this.probeRoles();
        //await this.probeMyVouches(roleEntries);
    }


    /** -- Perspective -- */

    private _perspective: VouchPerspective = {myVouches: {}}


    /** -- Methods -- */

    /** */
    private convertVouchEntry(entry: Vouch): TypedVouch {
        return {subject: encodeHashToBase64(entry.subject), forRole: entry.forRole};
    }


    // /** */
    // async createVouchThreshold(requiredCount: number, byRole: string, forRole: string): Promise<EntryHash> {
    //     const typed: VouchThreshold = {
    //     requiredCount, byRole, forRole
    // };
    // let res = await this.zomeProxy.publishVouchThreshold(typed);
    // this.probeThresholds();
    // return res;
    // }


    async vouchAgent(agent: AgentPubKeyB64, forRole: string): Promise<EntryHash> {
        const res = await this.zomeProxy.publishVouch({subject: decodeHashFromBase64(agent), forRole});
        this.probeAll();
        return res;
    }


/* */
    async getVouchAuthor(vouch: TypedVouch): Promise<AgentPubKeyB64> {
        let entry: Vouch = {subject: decodeHashFromBase64(vouch.subject), forRole: vouch.forRole};
    let res = await this.zomeProxy.getVouchAuthor(entry);
    return encodeHashToBase64(res);
    }


    /** */
    async probeMyVouches(roleEntries: [EntryHash, MembraneRole][]) {
        for (const [eh, roleEntry] of roleEntries) {
            const emittedEhs = await this.zomeProxy.getMyEmittedVouches(roleEntry.name);
            const receivedPairs: [EntryHash, AgentPubKey][] = await this.zomeProxy.getMyReceivedVouches(roleEntry.name);
            /* */
            let emitted: TypedVouch[] = [];
            for (const eh of emittedEhs) {
                const vouch = await this.zomeProxy.getVouch(eh);
                if (vouch) {
                    emitted.push(this.convertVouchEntry(vouch))
                }
            }
            /* */
            let received: [TypedVouch, AgentPubKeyB64][] = [];
            for (const [eh, author] of receivedPairs) {
                const vouch = await this.zomeProxy.getVouch(eh);
                if (vouch) {
                    const pair: [TypedVouch, AgentPubKeyB64] = [this.convertVouchEntry(vouch), encodeHashToBase64(author)]
                    received.push(pair)
                }
            }
            /* */
            this._perspective.myVouches[roleEntry.name] = [emitted, received];
        }
        this.notifySubscribers();
    }

}


