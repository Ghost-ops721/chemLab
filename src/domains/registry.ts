import type { DomainId, DomainModule, EngineInput, EngineResult, Item } from "@/types";
import { chemistryDomain } from "./chemistry";

const domains: Record<string, DomainModule> = {
  [chemistryDomain.id]: chemistryDomain,
};

export function registerDomain(mod: DomainModule): void {
  domains[mod.id] = mod;
}

export function getDomain(id: DomainId): DomainModule | undefined {
  return domains[id];
}

export function listDomains(): DomainModule[] {
  return Object.values(domains);
}

export function getAllItems(domainId: DomainId = "chemistry"): Item[] {
  return getDomain(domainId)?.getItems() ?? [];
}

export function getAllEquipment(domainId: DomainId = "chemistry"): Item[] {
  return getDomain(domainId)?.getEquipment() ?? [];
}

export function resolveDomain(
  domainId: DomainId,
  input: EngineInput,
): EngineResult {
  const mod = getDomain(domainId);
  if (!mod) {
    return {
      ok: false,
      products: [],
      effects: [
        {
          kind: "hazard",
          intensity: "low",
          messageKey: "no-reaction",
        },
      ],
      explanationKey: "no-reaction",
      discoveryId: `missing-domain::${domainId}`,
    };
  }
  return mod.resolve(input);
}

export { chemistryDomain };
