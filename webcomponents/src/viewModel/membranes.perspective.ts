import {MembraneThreshold, Privilege, ThresholdReachedProof} from "../bindings/membranes.types";
import {AgentPubKeyB64} from "@holochain/client";


/** */
export interface MembranesPerspective {
    /** EntryHashB64 -> <typed> */
    thresholds: Record<string, MembraneThreshold>,
    membranes: Record<string, TypedMembrane>,
    roles: Record<string, TypedMembraneRole>,
    myRoleClaims: Record<string, TypedRoleClaim>,
    myMembraneClaims: Record<string, TypedMembraneCrossedClaim>,
    /** RoleName -> [[emitted],[[received,author]]] */
    myVouches: Record<string, [TypedVouch[], [TypedVouch, AgentPubKeyB64][]]>
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
