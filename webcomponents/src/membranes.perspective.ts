import {AgentPubKeyB64, Dictionary} from "@holochain-open-dev/core-types";
import {MembraneThresholdEntry, Privilege, ThresholdReachedProof} from "./membranes.bindings";


/** */
export interface MembranesPerspective {
    /** EntryHashB64 -> <typed> */
    thresholds: Dictionary<MembraneThresholdEntry>,
    membranes: Dictionary<Membrane>,
    roles: Dictionary<MembraneRole>,
    myRoleClaims: Dictionary<RoleClaim>,
    myMembraneClaims: Dictionary<MembraneCrossedClaim>,
    /** RoleName -> [[emitted],[[received,author]]] */
    myVouches: Dictionary<[Vouch[], [Vouch, AgentPubKeyB64][]]>
}

export const emptyPerspective: MembranesPerspective = {
    thresholds: {},
    membranes: {},
    roles: {},
    myRoleClaims: {},
    myMembraneClaims: {},
    myVouches: {},
}


export interface Vouch {
    subject: AgentPubKeyB64,
    forRole: string,
}


export interface Membrane {
    thresholds: MembraneThresholdEntry[]
}

export interface MembraneRole {
    name: string,
    privileges: Privilege[],
    enteringMembranes: Membrane[],
}


export interface MembraneCrossedClaim {
    proofs: ThresholdReachedProof[], // TODO a B64 type of SignedActionHashed
    membrane: Membrane,
    subject: AgentPubKeyB64,
}

export interface RoleClaim {
    subject: AgentPubKeyB64,
    membraneIndex: number,
    role: MembraneRole,
    membraneClaim: MembraneCrossedClaim,
}
