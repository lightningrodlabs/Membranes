import {EntryHashB64, ActionHashB64, AgentPubKeyB64, Dictionary} from '@holochain-open-dev/core-types';
import {AgnosticClient, CellClient} from '@holochain-open-dev/cell-client';
import {CellId, EntryHash} from "@holochain/client";
import {serializeHash} from "@holochain-open-dev/utils";
import {MembranesBridge} from "./membranes.bridge";
import {MembraneEntry, MembraneRoleEntry, MembraneThresholdEntry, Privilege} from "./membranes.types";
import {createContext} from "@lit-labs/context";


const areEqual = (first: Uint8Array, second: Uint8Array) =>
      first.length === second.length && first.every((value, index) => value === second[index]);


export interface Membrane {
  thresholds: MembraneThresholdEntry[]
}

export interface MembraneRole {
  name: string,
  privileges: Privilege[],
  enteringMembranes: Membrane[],
}


export const membranesContext = createContext<MembranesViewModel>('membranes/service');


/**
 *
 */
export class MembranesViewModel {

  /** Fields */
  private membranesZome : MembranesBridge

  myAgentPubKey: AgentPubKeyB64;

  /** EntryHashB64 -> <typed> */
  thresholdStore: Dictionary<MembraneThresholdEntry> = {};
  membraneStore: Dictionary<Membrane> = {};
  roleStore: Dictionary<MembraneRole> = {};

  /** Methods */


  /** */
  private async pullThreshold(eh: EntryHash): Promise<MembraneThresholdEntry> {
    let thB64 = serializeHash(eh)
    const maybeThreshold = await this.membranesZome.getThreshold(eh)
    if (!maybeThreshold) {
      console.warn("pullThreshold() Failed. Can't find Threshold at " + thB64)
      return Promise.reject("pullThreshold() Failed. Can't find Threshold at " + thB64);
    }
    this.thresholdStore[thB64] = maybeThreshold!
    return maybeThreshold;
  }


  /** */
  private async pullMembrane(eh: EntryHash): Promise<Membrane> {
    let b64 = serializeHash(eh)
    const maybeEntry = await this.membranesZome.getMembrane(eh)
    if (!maybeEntry) {
      console.warn("pullMembrane() Failed. Can't find Membrane at " + b64)
      return Promise.reject("pullMembrane() Failed. Can't find Membrane at " + b64);
    }
    const membrane = await this.convertMembraneEntry(maybeEntry!)
    this.membraneStore[b64] = membrane
    return membrane;
  }


  /** */
  private async convertMembraneEntry(membraneEntry: MembraneEntry): Promise<Membrane> {
    let thresholds = []
    for (const thresholdEh of membraneEntry.thresholdEhs) {
      let maybeStoredThreshold = this.thresholdStore[serializeHash(thresholdEh)];
      if (!maybeStoredThreshold) {
        const threshold = await this.pullThreshold(thresholdEh);
        thresholds.push(threshold)
      }
    }
    return {thresholds};
  }


  /** */
  private async convertRoleEntry(entry: MembraneRoleEntry): Promise<MembraneRole> {
    let enteringMembranes = []
    for (const membraneEh of entry.enteringMembraneEhs) {
      let maybeStoredMembrane = this.membraneStore[serializeHash(membraneEh)];
      if (!maybeStoredMembrane) {
        const membrane = await this.pullMembrane(membraneEh);
        enteringMembranes.push(membrane)
      }
    }
    return {name: entry.name, privileges: entry.privileges, enteringMembranes};
  }


  /** */
  async pullAllFromDht() {
    /** Get Thresholds */
    const thresholdEntries = await this.membranesZome.getAllThresholds();
    for (const [eh, typed] of thresholdEntries) {
      const b64 = serializeHash(eh);
      this.thresholdStore[b64] = typed
    }
    console.log({thresholdStore: this.thresholdStore})

    /** Get Membranes */
    const membraneEntries = await this.membranesZome.getAllMembranes();
    //console.log("membraneEntries:", membraneEntries)
    for (const [eh, membraneEntry] of membraneEntries) {
      const b64 = serializeHash(eh);
      const membrane = await this.convertMembraneEntry(membraneEntry)
      this.membraneStore[b64] = membrane
    }
    console.log({membraneStore: this.membraneStore})

    /** Get Roles */
    const roleEntries = await this.membranesZome.getAllRoles();
    //console.log("roleEntries:", roleEntries)
    for (const [eh, roleEntry] of roleEntries) {
      const b64 = serializeHash(eh);
      const role = await this.convertRoleEntry(roleEntry);
      this.roleStore[b64] = role
    }
    console.log({membraneStore: this.membraneStore})

  }


  /** Ctor */
  constructor(protected client: AgnosticClient, cellId: CellId) {
    this.membranesZome = new MembranesBridge(client, cellId);
    this.myAgentPubKey = serializeHash(cellId[1]);
  }


}
