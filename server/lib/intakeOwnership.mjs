const clean = (value) => String(value || "").trim();

export function resolveOwnerClientName(profile = {}) {
  return clean(profile.full_name) || clean(profile.company);
}

export function bindIntakeResultToOwner(result = {}, { profile = {} } = {}) {
  const ownerClientName = resolveOwnerClientName(profile);
  if (!ownerClientName) return result;

  const project = result?.project && typeof result.project === "object" ? result.project : {};
  const extractedClientName = clean(project.client_name);
  const isUsefulExtractedName =
    extractedClientName &&
    !["portal intake client", "unassigned client"].includes(extractedClientName.toLowerCase()) &&
    extractedClientName.toLowerCase() !== ownerClientName.toLowerCase();

  return {
    ...result,
    project: {
      ...project,
      ...(isUsefulExtractedName && !project.source_client_name
        ? { source_client_name: extractedClientName }
        : {}),
      client_name: ownerClientName
    }
  };
}
