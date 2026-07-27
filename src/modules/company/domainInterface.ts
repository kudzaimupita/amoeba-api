/* eslint-disable prettier/prettier */

import mongoose from 'mongoose';

export interface IDnsValidationDetails {
  name: string;
  type: string;
  value: string;
  domainName: string;
  validationStatus: string;
}

export interface IApplicationDomain {
  domainName: string;
  subdomainPrefix?: string;
  rootDomain?: string;
  cloudFrontDistributionId: string;
  cloudFrontDomainName: string;
  status: 'pending' | 'deployed' | 'error';
  application: mongoose.Types.ObjectId;
  applicationVersion: mongoose.Types.ObjectId;
  isCustomDomain: boolean;
  sslCertificateArn?: string;
  certificateStatus?: 'PENDING_VALIDATION' | 'ISSUED' | 'FAILED' | 'EXPIRED' | 'INACTIVE';
  dnsValidated: boolean;
  dnsValidationDetails?: IDnsValidationDetails;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IApplicationDomainDoc extends IApplicationDomain, mongoose.Document {
  getFullDomain(): string;
  dnsStatus: string;
}

export interface IApplicationDomainCreateRequest {
  domainName: string;
  subdomainPrefix?: string;
  rootDomain?: string;
  cloudFrontDistributionId: string;
  cloudFrontDomainName: string;
  application: string | mongoose.Types.ObjectId;
  applicationVersion: string | mongoose.Types.ObjectId;
  isCustomDomain?: boolean;
  sslCertificateArn?: string;
}

export interface IApplicationDomainUpdateRequest {
  domainName?: string;
  subdomainPrefix?: string;
  rootDomain?: string;
  cloudFrontDistributionId?: string;
  cloudFrontDomainName?: string;
  status?: 'pending' | 'deployed' | 'error';
  application?: string | mongoose.Types.ObjectId;
  applicationVersion?: string | mongoose.Types.ObjectId;
  isCustomDomain?: boolean;
  sslCertificateArn?: string;
  certificateStatus?: 'PENDING_VALIDATION' | 'ISSUED' | 'FAILED' | 'EXPIRED' | 'INACTIVE';
  dnsValidated?: boolean;
  dnsValidationDetails?: IDnsValidationDetails;
  errorMessage?: string;
}
