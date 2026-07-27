// Resource and Application Management Types

export type ResourceStatus = 'active' | 'paused' | 'stopped' | 'deleted' | 'error';

export interface ResourceManagementAction {
  resourceId: string;
  status: ResourceStatus;
  timestamp: Date;
  reason?: string;
}

export interface ApplicationManagementAction extends ResourceManagementAction {
  applicationId: string;
  cloudFrontDistributions?: string[]; // List of CloudFront distribution IDs
}

export interface CloudFrontDistributionConfig {
  id: string;
  applicationId: string;
  status: 'active' | 'paused' | 'disabled';
  domain: string;
  lastModified: Date;
}

// New interfaces for state tracking
export interface ResourceStateUpdate {
  resourceId: string;
  currentStatus: ResourceStatus;
  newStatus: ResourceStatus;
  reason?: string;
}

export interface ApplicationStateUpdate {
  applicationId: string;
  currentStatus: ResourceStatus;
  newStatus: ResourceStatus;
  cloudFrontDistributionIds?: string[];
  reason?: string;
}

// Existing request interfaces remain the same
export interface ResourcePauseRequest {
  resourceId: string;
  pauseReason?: string;
}

export interface ApplicationPauseRequest {
  applicationId: string;
  pauseReason?: string;
  preserveData?: boolean;
}

export interface ResourceStartRequest {
  resourceId: string;
  startMode?: 'restore' | 'fresh';
}

export interface ApplicationStartRequest {
  applicationId: string;
  startMode?: 'restore' | 'fresh';
}

export interface ResourceStopRequest {
  resourceId: string;
  stopReason?: string;
  force?: boolean;
}

export interface ApplicationStopRequest {
  applicationId: string;
  stopReason?: string;
  force?: boolean;
  deleteCloudFrontDistributions?: boolean;
}
