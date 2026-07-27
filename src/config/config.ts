import 'dotenv/config';

import Joi from 'joi';

const envVarsSchema = Joi.object()
  .keys({
    APP_AWS_ACCESS_KEY: Joi.string().required().description('aws key'),
    MAILER_SEND_KEY: Joi.string().required().description('novu key'),
    APP_AWS_ACCESS_SECRET: Joi.string().required().description('aws secret'),
    APP_AWS_REGION: Joi.string().default('us-east-1').description('aws region'),
    APP_AWS_DEFAULT_AMI_ID: Joi.string().allow('').optional().description('Default AMI ID for instance provisioning'),
    APP_AWS_DEFAULT_INSTANCE_TYPE: Joi.string()
      .allow('')
      .default('t3.micro')
      .description('Default EC2 instance type for instance deployments'),
    APP_AWS_SSM_INSTANCE_PROFILE: Joi.string()
      .allow('')
      .optional()
      .description('IAM instance profile name with SSM permissions'),
    APP_AWS_CODEBUILD_ENABLED: Joi.boolean()
      .default(true)
      .description('Enable AWS CodeBuild for eligible instance deployments'),
    APP_AWS_CODEBUILD_REGION: Joi.string()
      .allow('')
      .optional()
      .description('AWS region for CodeBuild and build-time ECR; defaults to APP_AWS_REGION'),
    APP_AWS_CODEBUILD_PROJECT_NAME: Joi.string()
      .allow('')
      .default('servly-builds')
      .description('Default AWS CodeBuild project name for instance deployment builds'),
    APP_AWS_CODEBUILD_ALLOW_CREATE: Joi.boolean()
      .default(false)
      .description('Allow API to create the default CodeBuild project when missing'),
    APP_AWS_CODEBUILD_SERVICE_ROLE_ARN: Joi.string()
      .allow('')
      .optional()
      .description('IAM role ARN used when creating CodeBuild projects'),
    APP_AWS_CODEBUILD_IMAGE: Joi.string()
      .allow('')
      .default('aws/codebuild/standard:7.0')
      .description('CodeBuild image used for remote builds'),
    APP_AWS_CODEBUILD_COMPUTE_TYPE: Joi.string()
      .allow('')
      .default('BUILD_GENERAL1_MEDIUM')
      .description('CodeBuild compute type for remote builds'),
    APP_AWS_CODEBUILD_TIMEOUT_MINUTES: Joi.number()
      .integer()
      .min(5)
      .max(480)
      .default(60)
      .description('CodeBuild timeout in minutes'),
    APP_AWS_CODEBUILD_DOCKER_PRIVILEGED: Joi.boolean()
      .default(true)
      .description('Enable privileged CodeBuild mode for Docker builds'),
    APP_AWS_ECR_REPOSITORY: Joi.string()
      .allow('')
      .default('servly-deployments')
      .description('ECR repository for CodeBuild Docker image output'),
    APP_AWS_CODEBUILD_ARTIFACT_BUCKET: Joi.string()
      .allow('')
      .optional()
      .description('S3 bucket for CodeBuild build artifacts'),
    INSTANCE_DEPLOYMENT_COMMAND_TIMEOUT_SECONDS: Joi.number()
      .integer()
      .min(60)
      .max(172800)
      .default(172800)
      .description('Maximum SSM command runtime for instance deployment commands'),
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    ENCRYPTION_KEY: Joi.string().required().description('Encryption key is required'),
    DEPLOYMENT_PROJECT_ENV_KEY: Joi.string()
      .allow('')
      .optional()
      .description('Dedicated encryption key for deployment project environment variables'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    CLIENT_URL: Joi.string().description('Client url'),
    CLAUDE_API: Joi.string().description('claude api'),
    API_URL: Joi.string().required().description('API base URL'),
    CONTROLLER_API_BASE: Joi.string().description('Controller API base URL'),
    GOOGLE_CLIENT_ID: Joi.string().description('Google OAuth client ID'),
    GOOGLE_CLIENT_SECRET: Joi.string().description('Google OAuth client secret'),
    GITHUB_CLIENT_ID: Joi.string().description('GitHub OAuth client ID'),
    GITHUB_CLIENT_SECRET: Joi.string().description('GitHub OAuth client secret'),
    GITHUB_VCS_CLIENT_ID: Joi.string()
      .allow('')
      .optional()
      .description('GitHub OAuth client ID for repository deployment access'),
    GITHUB_VCS_CLIENT_SECRET: Joi.string()
      .allow('')
      .optional()
      .description('GitHub OAuth client secret for repository deployment access'),
    GITHUB_VSC_CLIENT_ID: Joi.string().allow('').optional().description('Alias for GITHUB_VCS_CLIENT_ID'),
    GITHUB_VSC_CLIENT_SECRET: Joi.string().allow('').optional().description('Alias for GITHUB_VCS_CLIENT_SECRET'),
    GOOGLE_CALLBACK_URL: Joi.string().description('Google OAuth callback URL'),
    GITHUB_CALLBACK_URL: Joi.string().description('GitHub OAuth callback URL'),
    GITHUB_VCS_CALLBACK_URL: Joi.string()
      .allow('')
      .optional()
      .description('GitHub OAuth callback URL for repository deployment access'),
    GITHUB_VSC_CALLBACK_URL: Joi.string().allow('').optional().description('Alias for GITHUB_VCS_CALLBACK_URL'),
    GITHUB_APP_SLUG: Joi.string().allow('').optional().description('GitHub App slug used for installation links'),
    GITHUB_APP_SETUP_CALLBACK_URL: Joi.string().allow('').optional().description('GitHub App setup callback URL'),
    GITHUB_APP_ID: Joi.string().allow('').optional().description('GitHub App ID for installation-token repository access'),
    GITHUB_APP_PRIVATE_KEY: Joi.string()
      .allow('')
      .optional()
      .description('GitHub App private key for installation-token repository access'),
    GITHUB_DEPLOYMENT_WEBHOOK_SECRET: Joi.string()
      .allow('')
      .optional()
      .description('GitHub deployment-project webhook secret'),
    GITLAB_VCS_CLIENT_ID: Joi.string()
      .allow('')
      .optional()
      .description('GitLab OAuth client ID for repository deployment access'),
    GITLAB_VCS_CLIENT_SECRET: Joi.string()
      .allow('')
      .optional()
      .description('GitLab OAuth client secret for repository deployment access'),
    GITLAB_VCS_CALLBACK_URL: Joi.string()
      .allow('')
      .optional()
      .description('GitLab OAuth callback URL for repository deployment access'),
    GITLAB_BASE_URL: Joi.string().allow('').optional().description('GitLab base URL'),
    GITLAB_API_BASE_URL: Joi.string().allow('').optional().description('GitLab API base URL'),
    GITLAB_DEPLOYMENT_WEBHOOK_SECRET: Joi.string()
      .allow('')
      .optional()
      .description('GitLab deployment-project webhook token'),
    BITBUCKET_DEPLOYMENT_WEBHOOK_SECRET: Joi.string()
      .allow('')
      .optional()
      .description('Bitbucket deployment-project webhook secret'),
    OPENAI_API_KEY: Joi.string().description('OpenAI API key'),
    BETA_WHITELIST_ENABLED: Joi.boolean().default(true).description('Enable beta user whitelisting'),
    USE_DYNAMIC_PROMPTS: Joi.boolean().default(false).description('Enable dynamic prompt retrieval via semantic search'),
    DYNAMIC_PROMPT_PERCENTAGE: Joi.number()
      .min(0)
      .max(100)
      .default(0)
      .description('Percentage of tasks using dynamic prompts'),
    SCRAPE_MAX_LENGTH: Joi.number()
      .min(1000)
      .max(200000)
      .default(20000)
      .description('Maximum characters returned from profiler web scrapes'),
    CLAUDE_REQUESTS_PER_MINUTE: Joi.number()
      .min(1)
      .max(10000)
      .default(45)
      .description('Maximum Claude API requests per minute (free tier: 50, paid: 1000+)'),
    CLAUDE_RATE_LIMIT_DELAY_MS: Joi.number()
      .min(0)
      .max(60000)
      .default(0)
      .description('Minimum delay between Claude API requests in ms (0 = auto-calculate)'),
    GITHUB_DEPLOY_TOKEN: Joi.string().allow('').optional().description('GitHub token used to dispatch deployment workflow'),
    GITHUB_DEPLOY_REPO_OWNER: Joi.string()
      .allow('')
      .optional()
      .description('GitHub repository owner for deployment workflow'),
    GITHUB_DEPLOY_REPO_NAME: Joi.string().allow('').optional().description('GitHub repository name for deployment workflow'),
    GITHUB_DEPLOY_WORKFLOW_ID: Joi.string()
      .allow('')
      .optional()
      .description('Workflow file name or ID for GitHub deployment workflow'),
    GITHUB_DEPLOY_REF: Joi.string()
      .allow('')
      .default('main')
      .description('Git reference used when dispatching the GitHub deployment workflow'),
    FIGMA_CLIENT_ID: Joi.string().allow('').optional().description('Figma OAuth client ID for MCP integration'),
    FIGMA_CLIENT_SECRET: Joi.string().allow('').optional().description('Figma OAuth client secret for MCP integration'),
    FIGMA_OAUTH_CALLBACK_URL: Joi.string().allow('').optional().description('Figma OAuth callback URL'),
    GITHUB_REPO_PAT: Joi.string()
      .allow('')
      .optional()
      .description('GitHub personal access token for cloning source repository'),
    GITHUB_REPO_LIST_MAX: Joi.number()
      .integer()
      .min(100)
      .max(5000)
      .default(1000)
      .description('Maximum GitHub repositories to fetch for source selection'),
    GITLAB_REPO_PAT: Joi.string()
      .allow('')
      .optional()
      .description('GitLab personal access token for repository source selection'),
    GITLAB_REPO_LIST_MAX: Joi.number()
      .integer()
      .min(100)
      .max(5000)
      .default(1000)
      .description('Maximum GitLab repositories to fetch for source selection'),
    BITBUCKET_USERNAME: Joi.string()
      .allow('')
      .optional()
      .description('Bitbucket username used with BITBUCKET_APP_PASSWORD for repository source selection'),
    BITBUCKET_APP_PASSWORD: Joi.string()
      .allow('')
      .optional()
      .description('Bitbucket app password for repository source selection'),
    BITBUCKET_REPO_LIST_MAX: Joi.number()
      .integer()
      .min(100)
      .max(5000)
      .default(1000)
      .description('Maximum Bitbucket repositories to fetch for source selection'),
    GITHUB_SOURCE_REPO_OWNER: Joi.string().allow('').optional().description('Source repository owner'),
    GITHUB_SOURCE_REPO_NAME: Joi.string().allow('').optional().description('Source repository name'),
    GITHUB_SOURCE_REPO_BRANCH: Joi.string().allow('').optional().description('Source repository branch'),
    S3_ASSETS_BUCKET: Joi.string().default('servly-assets').description('S3 bucket for component media assets'),
    S3_SOURCE_ARTIFACTS_BUCKET: Joi.string()
      .default('servly-source-artifacts')
      .description('S3 bucket for deployment source artifacts'),
    S3_ENDPOINT: Joi.string()
      .allow('')
      .optional()
      .description('S3 endpoint override (e.g. http://localhost:4566 for LocalStack)'),
    SERVLY_APP_ROOT_DOMAIN: Joi.string()
      .allow('')
      .default('servly.app')
      .description('Root domain used for generated instance deployment URLs'),
    SERVLY_APP_HOSTED_ZONE_ID: Joi.string()
      .allow('')
      .optional()
      .description('Route53 hosted zone ID for SERVLY_APP_ROOT_DOMAIN'),
    DEPLOYMENT_DOMAIN_ALB_ARN: Joi.string().allow('').optional().description('ALB ARN used for deployment project domains'),
    DEPLOYMENT_DOMAIN_ALB_DNS_NAME: Joi.string().allow('').optional().description('ALB DNS name used for deployment project domains'),
    DEPLOYMENT_DOMAIN_ALB_HOSTED_ZONE_ID: Joi.string()
      .allow('')
      .optional()
      .description('ALB hosted zone ID used for Route53 alias records'),
    DEPLOYMENT_DOMAIN_ALB_HTTP_LISTENER_ARN: Joi.string()
      .allow('')
      .optional()
      .description('HTTP listener ARN used for deployment project domain host rules'),
    DEPLOYMENT_DOMAIN_ALB_HTTPS_LISTENER_ARN: Joi.string()
      .allow('')
      .optional()
      .description('HTTPS listener ARN used for deployment project domain host rules'),
    DEPLOYMENT_DOMAIN_WILDCARD_CERT_ARN: Joi.string()
      .allow('')
      .optional()
      .description('Wildcard ACM certificate ARN for generated deployment project domains'),
    DEPLOYMENT_DOMAIN_ROUTING_MODE: Joi.string()
      .valid('alb', 'cloudfront_edge')
      .default('alb')
      .description('Deployment domain routing implementation'),
    DEPLOYMENT_DOMAIN_CLOUDFRONT_DISTRIBUTION_ID: Joi.string()
      .allow('')
      .optional()
      .description('Global CloudFront distribution used for generated deployment domains'),
    DEPLOYMENT_DOMAIN_CLOUDFRONT_DNS_NAME: Joi.string()
      .allow('')
      .optional()
      .description('DNS name of the global deployment CloudFront distribution'),
    DEPLOYMENT_DOMAIN_CLOUDFRONT_HOSTED_ZONE_ID: Joi.string()
      .allow('')
      .default('Z2FDTNDATAQYW2')
      .description('Route53 hosted zone ID for CloudFront aliases'),
    DEPLOYMENT_DOMAIN_CLOUDFRONT_KVS_ARN: Joi.string()
      .allow('')
      .optional()
      .description('CloudFront KeyValueStore ARN containing hostname routing records'),
    DEPLOYMENT_DOMAIN_ORIGIN_SHARED_SECRET: Joi.string()
      .allow('')
      .optional()
      .description('Secret header value sent by CloudFront to regional ingress ALBs'),
    DEPLOYMENT_DOMAIN_REGIONAL_INGRESS_AUTO_PROVISION: Joi.boolean()
      .default(false)
      .description('Allow Servly to create one shared HTTP ingress ALB per AWS region and VPC'),
    LETSENCRYPT_EMAIL: Joi.string()
      .allow('')
      .optional()
      .description('Email address used for Let’s Encrypt certificate registration'),
    TEST_EMAIL: Joi.string().allow('').optional().description('Test email that bypasses OTP and password verification'),
    ATLASSIAN_CLIENT_ID: Joi.string().allow('').optional().description('Atlassian OAuth 2.0 (3LO) client ID'),
    ATLASSIAN_CLIENT_SECRET: Joi.string().allow('').optional().description('Atlassian OAuth 2.0 (3LO) client secret'),
    ATLASSIAN_OAUTH_CALLBACK_URL: Joi.string().allow('').optional().description('Atlassian OAuth callback URL'),
    NODE_GATEWAY_SHARED_SECRET: Joi.string().allow('').optional().description('Shared secret for the node gateway'),
    NODE_GATEWAY_INTERNAL_URL: Joi.string().allow('').optional().description('Internal node gateway control URL'),
    NODE_EDGE_PUBLIC_URL: Joi.string()
      .uri({ scheme: ['ws', 'wss'] })
      .allow('')
      .optional()
      .description('Public WebSocket URL used by Servly Nodes to establish their outbound application tunnel'),
    DEPLOYMENT_NODE_EDGE_ORIGIN_DOMAIN_NAME: Joi.string()
      .hostname()
      .allow('')
      .optional()
      .description('Public origin hostname for the shared Servly Node edge relay'),
    DEPLOYMENT_NODE_EDGE_ORIGIN_HOST_HEADER: Joi.string()
      .hostname()
      .allow('')
      .optional()
      .description('Host header CloudFront sends to the shared Servly Node edge relay'),
    DEPLOYMENT_NODE_EDGE_ORIGIN_PROTOCOL: Joi.string()
      .valid('http', 'https')
      .default('https')
      .description('Protocol CloudFront uses for the shared Servly Node edge relay'),
    DEPLOYMENT_NODE_EDGE_ORIGIN_PORT: Joi.number()
      .integer()
      .min(1)
      .max(65535)
      .default(443)
      .description('Port CloudFront uses for the shared Servly Node edge relay'),
    SERVLY_NODES_ENABLED: Joi.boolean().default(false).description('Enable the private Servly Nodes alpha'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  encryptionKey: envVars.ENCRYPTION_KEY,
  deploymentProjectEnvKey: envVars.DEPLOYMENT_PROJECT_ENV_KEY,
  mailerSendKey: envVars.MAILER_SEND_KEY,
  awsKey: envVars.APP_AWS_ACCESS_KEY,
  awsSecret: envVars.APP_AWS_ACCESS_SECRET,
  awsRegion: envVars.APP_AWS_REGION,
  awsDefaultAmiId: envVars.APP_AWS_DEFAULT_AMI_ID,
  awsDefaultInstanceType: envVars.APP_AWS_DEFAULT_INSTANCE_TYPE || 't3.micro',
  awsSsmInstanceProfile: envVars.APP_AWS_SSM_INSTANCE_PROFILE,
  awsCodeBuild: {
    enabled: envVars.APP_AWS_CODEBUILD_ENABLED,
    region: envVars.APP_AWS_CODEBUILD_REGION || envVars.APP_AWS_REGION,
    projectName: envVars.APP_AWS_CODEBUILD_PROJECT_NAME || 'servly-builds',
    allowCreate: envVars.APP_AWS_CODEBUILD_ALLOW_CREATE,
    serviceRoleArn: envVars.APP_AWS_CODEBUILD_SERVICE_ROLE_ARN,
    image: envVars.APP_AWS_CODEBUILD_IMAGE || 'aws/codebuild/standard:7.0',
    computeType: envVars.APP_AWS_CODEBUILD_COMPUTE_TYPE || 'BUILD_GENERAL1_MEDIUM',
    timeoutMinutes: envVars.APP_AWS_CODEBUILD_TIMEOUT_MINUTES,
    dockerPrivileged: envVars.APP_AWS_CODEBUILD_DOCKER_PRIVILEGED,
    ecrRepository: envVars.APP_AWS_ECR_REPOSITORY || 'servly-deployments',
    artifactBucket: envVars.APP_AWS_CODEBUILD_ARTIFACT_BUCKET || envVars.S3_SOURCE_ARTIFACTS_BUCKET,
  },
  instanceDeploymentCommandTimeoutSeconds: envVars.INSTANCE_DEPLOYMENT_COMMAND_TIMEOUT_SECONDS,
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  claudeApi: envVars.CLAUDE_API,
  apiUrl: envVars.API_URL,
  nodeGateway: {
    sharedSecret: envVars.NODE_GATEWAY_SHARED_SECRET || '',
    internalUrl: envVars.NODE_GATEWAY_INTERNAL_URL || '',
    enabled: envVars.SERVLY_NODES_ENABLED,
  },
  nodeEdge: {
    publicUrl:
      envVars.NODE_EDGE_PUBLIC_URL ||
      (envVars.DEPLOYMENT_NODE_EDGE_ORIGIN_DOMAIN_NAME
        ? `${envVars.DEPLOYMENT_NODE_EDGE_ORIGIN_PROTOCOL === 'http' ? 'ws' : 'wss'}://${
            envVars.DEPLOYMENT_NODE_EDGE_ORIGIN_DOMAIN_NAME
          }/v1/agents/tunnel`
        : ''),
    originDomainName: envVars.DEPLOYMENT_NODE_EDGE_ORIGIN_DOMAIN_NAME || '',
    originHostHeader: envVars.DEPLOYMENT_NODE_EDGE_ORIGIN_HOST_HEADER || '',
    originProtocol: envVars.DEPLOYMENT_NODE_EDGE_ORIGIN_PROTOCOL || 'https',
    originPort: envVars.DEPLOYMENT_NODE_EDGE_ORIGIN_PORT || 443,
  },
  controllerApiBase: envVars.CONTROLLER_API_BASE,
  openaiApiKey: envVars.OPENAI_API_KEY,
  betaWhitelistEnabled: envVars.BETA_WHITELIST_ENABLED,
  useDynamicPrompts: envVars.USE_DYNAMIC_PROMPTS,
  dynamicPromptPercentage: envVars.DYNAMIC_PROMPT_PERCENTAGE,
  profiler: {
    scrapeMaxLength: envVars.SCRAPE_MAX_LENGTH,
  },
  claudeRequestsPerMinute: envVars.CLAUDE_REQUESTS_PER_MINUTE,
  claudeRateLimitDelayMs: envVars.CLAUDE_RATE_LIMIT_DELAY_MS,
  githubDeployment: {
    token: envVars.GITHUB_DEPLOY_TOKEN,
    repoOwner: envVars.GITHUB_DEPLOY_REPO_OWNER,
    repoName: envVars.GITHUB_DEPLOY_REPO_NAME,
    workflowId: envVars.GITHUB_DEPLOY_WORKFLOW_ID,
    ref: envVars.GITHUB_DEPLOY_REF || 'main',
  },
  githubSource: {
    owner: envVars.GITHUB_SOURCE_REPO_OWNER || envVars.GITHUB_DEPLOY_REPO_OWNER,
    name: envVars.GITHUB_SOURCE_REPO_NAME || envVars.GITHUB_DEPLOY_REPO_NAME,
    branch: envVars.GITHUB_SOURCE_REPO_BRANCH || envVars.GITHUB_DEPLOY_REF || 'main',
    token: envVars.GITHUB_REPO_PAT,
    repoListMax: envVars.GITHUB_REPO_LIST_MAX,
  },
  gitlabSource: {
    token: envVars.GITLAB_REPO_PAT,
    repoListMax: envVars.GITLAB_REPO_LIST_MAX,
    baseUrl: envVars.GITLAB_BASE_URL || 'https://gitlab.com',
    apiBaseUrl: envVars.GITLAB_API_BASE_URL || 'https://gitlab.com/api/v4',
  },
  bitbucketSource: {
    username: envVars.BITBUCKET_USERNAME,
    appPassword: envVars.BITBUCKET_APP_PASSWORD,
    repoListMax: envVars.BITBUCKET_REPO_LIST_MAX,
    apiBaseUrl: 'https://api.bitbucket.org/2.0',
  },
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
    cookieOptions: {
      httpOnly: true,
      secure: envVars.NODE_ENV === 'production',
      signed: true,
    },
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  oauth: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      callbackUrl: envVars.GOOGLE_CALLBACK_URL || `${envVars.API_URL}/v1/auth/google/callback`,
    },
    github: {
      clientId: envVars.GITHUB_CLIENT_ID,
      clientSecret: envVars.GITHUB_CLIENT_SECRET,
      callbackUrl: envVars.GITHUB_CALLBACK_URL || `${envVars.API_URL}/v1/auth/github/callback`,
      vcsClientId: envVars.GITHUB_VCS_CLIENT_ID || envVars.GITHUB_VSC_CLIENT_ID,
      vcsClientSecret: envVars.GITHUB_VCS_CLIENT_SECRET || envVars.GITHUB_VSC_CLIENT_SECRET,
      vcsCallbackUrl:
        envVars.GITHUB_VCS_CALLBACK_URL ||
        envVars.GITHUB_VSC_CALLBACK_URL ||
        `${envVars.API_URL}/v1/deployment-sources/git/github/callback`,
      appSlug: envVars.GITHUB_APP_SLUG,
      appSetupCallbackUrl:
        envVars.GITHUB_APP_SETUP_CALLBACK_URL || `${envVars.API_URL}/v1/deployment-sources/git/github/setup`,
      appId: envVars.GITHUB_APP_ID,
      appPrivateKey: envVars.GITHUB_APP_PRIVATE_KEY,
      deploymentWebhookSecret: envVars.GITHUB_DEPLOYMENT_WEBHOOK_SECRET,
    },
    gitlab: {
      vcsClientId: envVars.GITLAB_VCS_CLIENT_ID,
      vcsClientSecret: envVars.GITLAB_VCS_CLIENT_SECRET,
      vcsCallbackUrl:
        envVars.GITLAB_VCS_CALLBACK_URL || `${envVars.API_URL}/v1/deployment-sources/git/gitlab/callback`,
      baseUrl: envVars.GITLAB_BASE_URL || 'https://gitlab.com',
      apiBaseUrl: envVars.GITLAB_API_BASE_URL || 'https://gitlab.com/api/v4',
      deploymentWebhookSecret: envVars.GITLAB_DEPLOYMENT_WEBHOOK_SECRET,
    },
    bitbucket: {
      deploymentWebhookSecret: envVars.BITBUCKET_DEPLOYMENT_WEBHOOK_SECRET,
    },
    figma: {
      clientId: envVars.FIGMA_CLIENT_ID,
      clientSecret: envVars.FIGMA_CLIENT_SECRET,
      callbackUrl: envVars.FIGMA_OAUTH_CALLBACK_URL || 'http://localhost:5001/v1/auth/figma/callback',
    },
    atlassian: {
      clientId: envVars.ATLASSIAN_CLIENT_ID,
      clientSecret: envVars.ATLASSIAN_CLIENT_SECRET,
      callbackUrl: envVars.ATLASSIAN_OAUTH_CALLBACK_URL || `${envVars.API_URL}/v1/auth/atlassian/callback`,
    },
  },
  clientUrl: envVars.CLIENT_URL,
  s3AssetsBucket: envVars.S3_ASSETS_BUCKET,
  s3SourceArtifactsBucket: envVars.S3_SOURCE_ARTIFACTS_BUCKET,
  s3Endpoint: envVars.S3_ENDPOINT,
  servlyAppRootDomain: envVars.SERVLY_APP_ROOT_DOMAIN || 'servly.app',
  servlyAppHostedZoneId: envVars.SERVLY_APP_HOSTED_ZONE_ID,
  deploymentDomainAlbArn: envVars.DEPLOYMENT_DOMAIN_ALB_ARN,
  deploymentDomainAlbDnsName: envVars.DEPLOYMENT_DOMAIN_ALB_DNS_NAME,
  deploymentDomainAlbHostedZoneId: envVars.DEPLOYMENT_DOMAIN_ALB_HOSTED_ZONE_ID,
  deploymentDomainAlbHttpListenerArn: envVars.DEPLOYMENT_DOMAIN_ALB_HTTP_LISTENER_ARN,
  deploymentDomainAlbHttpsListenerArn: envVars.DEPLOYMENT_DOMAIN_ALB_HTTPS_LISTENER_ARN,
  deploymentDomainWildcardCertArn: envVars.DEPLOYMENT_DOMAIN_WILDCARD_CERT_ARN,
  deploymentDomainRoutingMode: envVars.DEPLOYMENT_DOMAIN_ROUTING_MODE || 'alb',
  deploymentDomainCloudFrontDistributionId: envVars.DEPLOYMENT_DOMAIN_CLOUDFRONT_DISTRIBUTION_ID,
  deploymentDomainCloudFrontDnsName: envVars.DEPLOYMENT_DOMAIN_CLOUDFRONT_DNS_NAME,
  deploymentDomainCloudFrontHostedZoneId: envVars.DEPLOYMENT_DOMAIN_CLOUDFRONT_HOSTED_ZONE_ID || 'Z2FDTNDATAQYW2',
  deploymentDomainCloudFrontKvsArn: envVars.DEPLOYMENT_DOMAIN_CLOUDFRONT_KVS_ARN,
  deploymentDomainOriginSharedSecret: envVars.DEPLOYMENT_DOMAIN_ORIGIN_SHARED_SECRET,
  deploymentDomainRegionalIngressAutoProvision: envVars.DEPLOYMENT_DOMAIN_REGIONAL_INGRESS_AUTO_PROVISION,
  letsEncryptEmail: envVars.LETSENCRYPT_EMAIL || envVars.EMAIL_FROM,
  testEmail: envVars.TEST_EMAIL,
};

export default config;
