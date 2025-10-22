import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {ProgenitorProxy} from "../bindings/progenitor.proxy";


/** */
export interface ProgenitorPerspective {}


/** */
export class ProgenitorZvm extends ZomeViewModel {

    static override readonly ZOME_PROXY = ProgenitorProxy;

    get zomeProxy(): ProgenitorProxy {
        return this._zomeProxy as ProgenitorProxy;
    }


    /** -- ViewModel -- */

    private _perspective: ProgenitorPerspective = {thresholds: []}


    /* */
    get perspective(): ProgenitorPerspective {
        return this._perspective;
    }

}
