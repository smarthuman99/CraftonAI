const getIntakeFile = (job = {}) =>
  Array.isArray(job.intake_files) ? job.intake_files[0] || null : job.intake_files || null;

export const getPortalJobOwnerId = (job = {}) => {
  const intakeFile = getIntakeFile(job);
  return String(job.user_id || job.requested_by || intakeFile?.user_id || intakeFile?.uploaded_by || "").trim();
};

export const filterPortalJobsForOwner = (jobs = [], ownerId = "") => {
  const normalizedOwnerId = String(ownerId || "").trim();
  if (!normalizedOwnerId) return [];
  return (Array.isArray(jobs) ? jobs : []).filter((job) => getPortalJobOwnerId(job) === normalizedOwnerId);
};

export const buildPortalOwnershipFilter = (ownerId = "") => {
  const normalizedOwnerId = String(ownerId || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(normalizedOwnerId)) {
    throw new Error("A valid authenticated owner id is required.");
  }
  return `user_id.eq.${normalizedOwnerId},requested_by.eq.${normalizedOwnerId}`;
};
