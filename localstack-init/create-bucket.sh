#!/bin/bash
# Create the servly-assets bucket on LocalStack startup

awslocal s3 mb s3://servly-assets 2>/dev/null || true

# Set public read policy
awslocal s3api put-bucket-policy --bucket servly-assets --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::servly-assets/*"
    }
  ]
}'

echo "LocalStack S3 bucket 'servly-assets' created with public-read policy"
