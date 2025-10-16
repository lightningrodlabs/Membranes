import {AgentId, ZomeViewModel} from "@ddd-qc/lit-happ";
import {VouchProxy} from "../bindings/vouch.proxy";
import {
    AgentPubKey,
    EntryHash
} from "@holochain/client";
import {Vouch, VouchThreshold} from "../bindings/vouch.types";


export interface TypedVouch {
    subject: AgentId,
    forRole: string,
}


export interface VouchPerspective {
    roleNames: string[],
    /** RoleName -> [[emitted],[[received,author]]] */
    myVouches: Record<string, [TypedVouch[], [TypedVouch, AgentId][]]>,

    thresholds: VouchThreshold[],
}


/**
 *
 */
export class VouchZvm extends ZomeViewModel {

    static override readonly ZOME_PROXY = VouchProxy;
    get zomeProxy(): VouchProxy {return this._zomeProxy as VouchProxy;}


    /** -- ViewModel -- */

    /* */
    get perspective(): VouchPerspective {
        return this._perspective;
    }

    /* */
    protected override hasChanged(): boolean {
        // TODO
        return true;
    }


    /** */
    override async probeAllInner(): Promise<void> {
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
        return {subject: new AgentId(entry.subject), forRole: entry.forRole};
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


    async vouchAgent(agent: AgentId, forRole: string): Promise<EntryHash> {
        const res = await this.zomeProxy.publishVouch({subject: agent.hash, forRole});
        this.probeAll();
        return res;
    }


    /* */
    async getVouchAuthor(vouch: TypedVouch): Promise<AgentId> {
        let entry: Vouch = {subject: vouch.subject.hash, forRole: vouch.forRole};
        let res = await this.zomeProxy.getVouchAuthor(entry);
        return new AgentId(res);
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
            let received: [TypedVouch, AgentId][] = [];
            for (const [eh, author] of receivedPairs) {
                const vouch = await this.zomeProxy.getVouch(eh);
                if (vouch) {
                    const pair: [TypedVouch, AgentId] = [this.convertVouchEntry(vouch), new AgentId(author)]
                    received.push(pair)
                }
            }
            /* */
            this._perspective.myVouches[roleName] = [emitted, received];
        }
        this.notifySubscribers();
    }

}


