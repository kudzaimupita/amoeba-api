export const extractWorkspaceId = (user: Record<string, any>): string | undefined => {
  const company = user?.company ?? user?._doc?.company ?? user?.lastActiveWorkspace ?? user?._doc?.lastActiveWorkspace;

  if (!company) return undefined;
  if (typeof company === 'string') return company;
  return company._id?.toString?.() ?? company.id?.toString?.() ?? company.toString?.();
};
