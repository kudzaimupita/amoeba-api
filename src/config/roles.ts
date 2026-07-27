// For development - users get ALL permissions
const allPermissions = [
  // Plugin data operations
  'create-pluginData',
  'read-pluginData',
  'update-pluginData',
  'delete-pluginData',
  // Plugin file operations
  'create-pluginDataFile',
  'read-pluginDataFile',
  'update-pluginDataFile',
  'delete-pluginDataFile',
  // Plugin email operations
  'create-pluginDataEmail',
  // Plugin token operations
  'generate-pluginDataTokens',
  'create-pluginDataGenerateToken',
  'create-pluginDataBlacklistToken',
  // Resource operations
  'create-resource',
  'read-resource',
  'readList-resource',
  'update-resource',
  'delete-resource',
  // Database operations
  'create-database',
  'read-database',
  'update-database',
  'delete-database',
  // Deployment operations
  'create-deployment',
  'read-deployment',
  'update-deployment',
  // User operations
  'getUsers',
  'manageUsers',
  // Activity logs
  'create-activityLog',
  'read-activityLog',
  'update-activityLog',
  'delete-activityLog',
  // Change logs
  'create-changeLog',
  'read-changeLog',
  'update-changeLog',
  'delete-changeLog',
  // Clusters
  'create-cluster',
  'read-cluster',
  'update-cluster',
  'delete-cluster',
  // EC2 instances
  'create-instance',
  'read-instance',
  'readList-instance',
  'update-instance',
  'delete-instance',
  // Organisation-owned physical nodes
  'create-node',
  'read-node',
  'readList-node',
  'update-node',
  'delete-node',
  // Comments
  'create-comment',
  'read-comment',
  'update-comment',
  'delete-comment',
  // Companies
  'create-company',
  'read-company',
  'update-company',
  'delete-company',
  // Components
  'create-component',
  'read-component',
  'update-component',
  'delete-component',
  // Applications
  'create-application',
  'read-application',
  'update-application',
  'delete-application',
  // Beta users
  'create-betaUser',
  'read-betaUser',
  'update-betaUser',
  'delete-betaUser',
  // Environments
  'create-environment',
  'read-environment',
  'update-environment',
  'delete-environment',
  // HTML templates
  'create-htmlTemplate',
  'read-htmlTemplate',
  'update-htmlTemplate',
  'delete-htmlTemplate',
  // Secrets
  'create-secret',
  'read-secret',
  'update-secret',
  'delete-secret',
  // Presentations
  'create-presentation',
  'read-presentation',
  'update-presentation',
  'delete-presentation',
  // Scheduler jobs
  'create-schedulerJob',
  'read-schedulerJob',
  'update-schedulerJob',
  'delete-schedulerJob',
  // Billing
  'create-billing',
  'read-billing',
  'update-billing',
  'delete-billing',
  // App domains
  'create-appDomain',
  'read-appDomain',
  'update-appDomain',
  'delete-appDomain',
  // Automation
  'create-automation',
  'read-automation',
  'update-automation',
  'delete-automation',
  // Plugin Backups & Export
  'create-pluginBackup',
  'read-pluginBackup',
  'update-pluginBackup',
  'delete-pluginBackup',
  'export-pluginBackup',
  // System Administration
  'admin-system',
];

const allRoles = {
  user: allPermissions, // Users get ALL permissions for development
  admin: allPermissions, // Admins get same permissions
};

export const roles: string[] = Object.keys(allRoles);
export const roleRights: Map<string, string[]> = new Map(Object.entries(allRoles));
