import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {VouchProxy} from "../bindings/vouch.proxy";
import {
    ActionHashB64,
    AgentPubKey,
    AgentPubKeyB64,
    decodeHashFromBase64,
    encodeHashToBase64,
    EntryHash
} from "@holochain/client";
import {Vouch, VouchThreshold} from "../bindings/vouch.types";


export interface TypedVouch {
    subject: AgentPubKeyB64,
    forRole: string,
}


export interface VouchPerspective {
    roleNames: string[],
    /** RoleName -> [[emitted],[[received,author]]] */
    myVouches: Record<string, [TypedVouch[], [TypedVouch, AgentPubKeyB64][]]>,

    thresholds: VouchThreshold[],
}


/**
 *
 */
export class VouchZvm extends ZomeViewModel {

    static readonly ZOME_PROXY = VouchProxy;
    get zomeProxy(): VouchProxy {return this._zomeProxy as VouchProxy;}


    // constructor(cellProxy: CellProxy) {
    //     super(cellProxy, "zThreshold_Vouch")
    // }

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
        await this.probeRoleNames();
        await this.probeMyVouches();
        await this.probeThresholds();
    }


    /** */
    async probeThresholds(): Promise<void> {
        this._perspective.thresholds = await this.zomeProxy.getAllThresholdsVouch();
        this.notifySubscribers();
    }

    /** */
    async probeRoleNames(): Promise<void> {
        this._perspective.roleNames = await this.zomeProxy.getAllRoleNames();
        this.notifySubscribers();
    }

    /** -- Perspective -- */

    private _perspective: VouchPerspective = {roleNames: [], myVouches: {}, thresholds: []}


    /** -- Methods -- */

    /** */
    private convertVouchEntry(entry: Vouch): TypedVouch {
        return {subject: encodeHashToBase64(entry.subject), forRole: entry.forRole};
    }


    /** */
    async createThreshold(requiredCount: number, byRole: string, forRole: string): Promise<EntryHash> {
        const typed: VouchThreshold = {
        requiredCount, byRole, forRole
    };
      let res = await this.zomeProxy.publishVouchThreshold(typed);
      this.probeThresholds();
      return res;
    }


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
    async probeMyVouches() {
        for (const roleName of this.perspective.roleNames) {
            const emittedEhs = await this.zomeProxy.getMyEmittedVouches(roleName);
            const receivedPairs: [EntryHash, AgentPubKey][] = await this.zomeProxy.getMyReceivedVouches(roleName);
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
            this._perspective.myVouches[roleName] = [emitted, received];
        }
        this.notifySubscribers();
    }

}


