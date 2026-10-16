// Everything for one company's scenarios sits under ["scenarios", companyId] so it can be invalidated together.
export const scenarioKeys = {
  draft: (companyId: string) => ["scenarios", companyId, "draft"] as const,
  versions: (companyId: string) => ["scenarios", companyId, "versions"] as const,
  version: (versionId: string) => ["scenarios", "version", versionId] as const,
};
