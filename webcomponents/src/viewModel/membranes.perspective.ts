import {MembraneThreshold, Privilege, ThresholdReachedProof} from "../bindings/membranes.types";
import {AgentId} from "@ddd-qc/lit-happ";


/** */
export interface MembranesPerspective {
    /** type_name -> zome_name */
    thresholdTypes: Record<string, string>,
    /** EntryHashB64 -> <typed> */
    thresholds: Record<string, MembraneThreshold>,
    thresholdProof: ThresholdReachedProof[],
    membranes: Record<string, TypedMembrane>,
    roles: Record<string, TypedMembraneRole>,
    myRoleClaims: Record<string, TypedRoleClaim>,
    myMembraneClaims: Record<string, TypedMembraneCrossedClaim>,
}


export function defaultPerspective(): MembranesPerspective {
    return {
        thresholdTypes: {},
        thresholds: {},
        thresholdProof: [],
        membranes: {},
        roles: {},
        myRoleClaims: {},
        myMembraneClaims: {},
    }
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
    subject: AgentId,
}

export interface TypedRoleClaim {
    subject: AgentId,
    membraneIndex: number,
    role: TypedMembraneRole,
    membraneClaim: TypedMembraneCrossedClaim,
}
