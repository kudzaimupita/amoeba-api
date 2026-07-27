/* eslint-disable prettier/prettier */
// @ts-nocheck

import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import config from '../../config/config';

// Initialize AWS SDK services
const cloudfront = new AWS.CloudFront({
  region: 'us-east-1',
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
});

const acm = new AWS.ACM({
  region: 'us-east-1', // ACM certificates for CloudFront must be in us-east-1
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
});

/**
 * Assigns a custom domain to a CloudFront distribution and handles SSL certificate management
 * @param {string} domainName - The custom domain to associate
 * @param {string} cloudfrontDistId - The CloudFront distribution ID
 * @param {string} userId - ID of the user who owns the domain/app
 * @returns {Promise<Object>} - Domain configuration details
 */
export const assignDomainToCloudFront = async (domainName, cloudfrontDistId, userId) => {
  try {
    // 1. Request an SSL certificate for the domain
    const certificate = await requestCertificate(domainName);

    // 2. Wait until the certificate is issued
    // 3. Return the DNS validation records that the user needs to add
    const validationDetails = await getValidationDetails(certificate.CertificateArn);

    // 4. Store domain mapping in database for future reference
    const domainMapping = {
      id: uuidv4(),
      userId,
      domainName,
      cloudfrontDistId,
      certificateArn: certificate.CertificateArn,
      status: 'PENDING_VALIDATION',
      createdAt: new Date().toISOString(),
    };

    // 5. Return information the user needs to configure their DNS
    return {
      status: 'PENDING_VALIDATION',
      domain: domainName,
      cloudfrontDomain: await getCloudFrontDomain(cloudfrontDistId),
      certificateValidation: validationDetails,
      certificateArn: certificate.CertificateArn,
      message:
        'Please add the CNAME records to your DNS provider to validate the certificate and point your domain to CloudFront',
    };
  } catch (error) {
    throw new Error(`Failed to assign domain: ${error.message}`);
  }
};

/**
 * Request an SSL certificate for the domain
 * @param {string} domainName - The domain name
 * @returns {Promise<Object>} Certificate data
 */
export const requestCertificate = async (domainName) => {
  // Generate a properly formatted idempotency token
  // AWS requires idempotency tokens to match pattern \w+ (only alphanumeric chars and underscores)
  const idempotencyToken = uuidv4().replace(/-/g, '').substring(0, 32);

  const params = {
    DomainName: domainName,
    ValidationMethod: 'DNS',
    IdempotencyToken: idempotencyToken,
  };

  return acm.requestCertificate(params).promise();
};

/**
 * Get validation details for a certificate
 * @param {string} certificateArn - The certificate ARN
 * @returns {Promise<Object>} Validation details
 */
export const getValidationDetails = async (certificateArn) => {
  const params = {
    CertificateArn: certificateArn,
  };

  const certDetails = await acm.describeCertificate(params).promise();

  // The certificate might not have validation options immediately
  // Poll until validation details are available
  if (
    !certDetails.Certificate.DomainValidationOptions ||
    certDetails.Certificate.DomainValidationOptions.length === 0 ||
    !certDetails.Certificate.DomainValidationOptions[0].ResourceRecord
  ) {
    // Wait 2 seconds and try again
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return getValidationDetails(certificateArn);
  }

  // Extract validation record information
  const validationOption = certDetails.Certificate.DomainValidationOptions[0];
  const record = validationOption.ResourceRecord;

  return {
    name: record.Name,
    type: record.Type,
    value: record.Value,
    domainName: validationOption.DomainName,
    validationStatus: validationOption.ValidationStatus,
  };
};

/**
 * Get CloudFront domain name from distribution ID
 * @param {string} distributionId - The CloudFront distribution ID
 * @returns {Promise<string>} The CloudFront domain name
 */
export const getCloudFrontDomain = async (distributionId) => {
  const params = {
    Id: distributionId,
  };

  const distribution = await cloudfront.getDistribution(params).promise();
  return distribution.Distribution.DomainName;
};

/**
 * Poll the certificate status until it's issued
 * @param {string} certificateArn - The certificate ARN
 * @param {number} maxAttempts - Maximum polling attempts
 * @returns {Promise<boolean>} True if certificate is issued
 */
export const pollCertificateStatus = async (certificateArn, maxAttempts = 20) => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const params = {
      CertificateArn: certificateArn,
    };

    const certDetails = await acm.describeCertificate(params).promise();
    const status = certDetails.Certificate.Status;

    if (status === 'ISSUED') {
      return true;
    } if (status === 'FAILED') {
      throw new Error('Certificate validation failed');
    }

    attempts++;
    // Wait 30 seconds between checks
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }

  throw new Error('Certificate validation timed out');
};

/**
 * Get the status of a certificate
 * @param {string} certificateArn - The certificate ARN
 * @returns {Promise<Object>} Certificate status information
 */
export const getCertificateStatus = async (certificateArn) => {
  const params = {
    CertificateArn: certificateArn,
  };

  const certDetails = await acm.describeCertificate(params).promise();
  const validationOption = certDetails.Certificate.DomainValidationOptions[0];
  const isValidated = certDetails.Certificate.Status === 'ISSUED';

  let validationDetails = null;

  if (validationOption.ResourceRecord) {
    const record = validationOption.ResourceRecord;
    validationDetails = {
      name: record.Name,
      type: record.Type,
      value: record.Value,
      domainName: validationOption.DomainName,
      validationStatus: validationOption.ValidationStatus,
    };
  }

  return {
    status: certDetails.Certificate.Status,
    validationDetails,
    isValidated,
  };
};

/**
 * Update CloudFront distribution with the custom domain and certificate
 * @param {string} distributionId - The CloudFront distribution ID
 * @param {string} domainName - The custom domain name
 * @param {string} certificateArn - The certificate ARN
 * @returns {Promise<Object>} The updated distribution
 */
export const updateCloudFrontDistributionWithCertificate = async (distributionId, domainName, certificateArn) => {
  // Get current distribution config
  const getConfigParams = {
    Id: distributionId,
  };

  const configResult = await cloudfront.getDistributionConfig(getConfigParams).promise();
  const config = configResult.DistributionConfig;
  const etag = configResult.ETag;

  // Add the new domain alias
  if (!config.Aliases) {
    config.Aliases = {
      Quantity: 0,
      Items: [],
    };
  }

  // Check if the domain is already added
  const existingAliases = config.Aliases.Items || [];
  if (!existingAliases.includes(domainName)) {
    existingAliases.push(domainName);
    config.Aliases.Items = existingAliases;
    config.Aliases.Quantity = existingAliases.length;
  }

  // Update the SSL certificate
  if (!config.ViewerCertificate) {
    config.ViewerCertificate = {};
  }

  config.ViewerCertificate = {
    ACMCertificateArn: certificateArn,
    SSLSupportMethod: 'sni-only',
    MinimumProtocolVersion: 'TLSv1.2_2021',
    Certificate: certificateArn,
    CertificateSource: 'acm',
  };

  // Update the distribution
  const updateParams = {
    Id: distributionId,
    IfMatch: etag,
    DistributionConfig: config,
  };

  return cloudfront.updateDistribution(updateParams).promise();
};

/**
 * Complete the domain assignment process after the certificate is validated
 * @param {Object} domainMapping - Domain mapping information
 * @returns {Promise<Object>} Assignment result
 */
export const completeDomainAssignment = async (domainMapping) => {
  try {
    // Check if certificate is issued
    const isValid = await pollCertificateStatus(domainMapping.certificateArn);

    if (isValid) {
      // Update CloudFront with the custom domain and certificate
      await updateCloudFrontDistributionWithCertificate(
        domainMapping.cloudfrontDistId,
        domainMapping.domainName,
        domainMapping.certificateArn
      );

      // Update status
      domainMapping.status = 'ACTIVE';
      return {
        status: 'ACTIVE',
        domain: domainMapping.domainName,
        message: 'Your custom domain has been successfully configured and is now active',
      };
    }
  } catch (error) {
    domainMapping.status = 'FAILED';
    throw new Error(`Failed to complete domain assignment: ${error.message}`);
  }
};

/**
 * Check the status of a domain assignment
 * @param {string} domainName - The domain name
 * @param {string} userId - User ID associated with the domain
 * @returns {Promise<Object>} Domain status
 */
export const checkDomainStatus = async (domainName, userId) => {
  // In a real application, we would fetch the domain mapping from the database
  // Here we're assuming the domain mapping is passed to the function or
  // retrieved from our ApplicationDomain model

  // This function is called from our service where we already have the domain details,
  // so we need to recreate AWS service's expected structure
  const domainMapping = {
    certificateArn: null, // This would need to be provided
  };

  if (!domainMapping.certificateArn) {
    throw new Error('Certificate ARN required');
  }

  try {
    const params = {
      CertificateArn: domainMapping.certificateArn,
    };

    const certDetails = await acm.describeCertificate(params).promise();
    return {
      status: domainMapping.status || 'PENDING_VALIDATION',
      domain: domainName,
      certificateStatus: certDetails.Certificate.Status,
      validationStatus: certDetails.Certificate.DomainValidationOptions[0].ValidationStatus,
    };
  } catch (error) {
    return {
      status: 'ERROR',
      domain: domainName,
      message: `Error checking certificate: ${error.message}`,
    };
  }
};
