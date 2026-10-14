// Everything for one company's research sits under ["research", companyId] so it can be invalidated together.
export const researchKeys = {
  company: (companyId: string) => ["research", companyId] as const,
  draft: (companyId: string) => ["research", companyId, "draft"] as const,
  versions: (companyId: string) => ["research", companyId, "versions"] as const,
  links: (companyId: string) => ["research", companyId, "links"] as const,
  version: (versionId: string) => ["research", "version", versionId] as const,
};
