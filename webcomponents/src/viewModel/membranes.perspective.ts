import {AgentPubKeyB64, Dictionary} from "@holochain-open-dev/core-types";
import {MembraneThreshold, Privilege, ThresholdReachedProof} from "../bindings/membranes";


/** */
export interface MembranesPerspective {
    /** EntryHashB64 -> <typed> */
    thresholds: Dictionary<MembraneThreshold>,
    membranes: Dictionary<TypedMembrane>,
    roles: Dictionary<TypedMembraneRole>,
    myRoleClaims: Dictionary<TypedRoleClaim>,
    myMembraneClaims: Dictionary<TypedMembraneCrossedClaim>,
    /** RoleName -> [[emitted],[[received,author]]] */
    myVouches: Dictionary<[TypedVouch[], [TypedVouch, AgentPubKeyB64][]]>
}


export function defaultPerspective(): MembranesPerspective {
    return {
        thresholds: {},
        membranes: {},
        roles: {},
        myRoleClaims: {},
        myMembraneClaims: {},
        myVouches: {},
    }
}


export interface TypedVouch {
    subject: AgentPubKeyB64,
    forRole: string,
}


export interface TypedMembrane {
    thresholds: MembraneThreshold[]
}

export interface TypedMembraneRole {
    name: string,
    privileges: Privilege[],
    enteringMembranes: TypedMembrane[],
}


export interface TypedMembraneCrossedClaim {
    proofs: ThresholdReachedProof[], // TODO a B64 type of SignedActionHashed
    membrane: TypedMembrane,
    subject: AgentPubKeyB64,
}

export interface TypedRoleClaim {
    subject: AgentPubKeyB64,
    membraneIndex: number,
    role: TypedMembraneRole,
    membraneClaim: TypedMembraneCrossedClaim,
}
