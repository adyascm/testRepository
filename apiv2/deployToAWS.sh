#!/bin/bash

#Environment settings
DB_URL=${1:-'localhost:3306'}
DB_USERNAME=${2:-'root'}
DB_PWD=${3:-'root'}
DB_NAME=${4:-'dev'}
STAGE=${5:-'dev'}

#clean up
rm -rf target/dist/adyaapp &> /dev/null
mkdir target &> /dev/null
mkdir target/dist &> /dev/null
mkdir target/dist/adyaapp &> /dev/null
mkdir target/dist/adyaapp/core &> /dev/null
mkdir target/dist/adyaapp/gsuite &> /dev/null
mkdir target/dist/adyaapp/slack &> /dev/null

cp -r adya target/dist/adyaapp/core
cp -r lib/lib/python2.7/site-packages/* target/dist/adyaapp/core

cp -r adya target/dist/adyaapp/gsuite
cp -r lib/lib/python2.7/site-packages/* target/dist/adyaapp/gsuite

cp -r adya target/dist/adyaapp/slack
cp -r lib/lib/python2.7/site-packages/* target/dist/adyaapp/slack

cp core-serverless.yml target/dist/adyaapp/core/serverless.yml
cp gsuite-serverless.yml target/dist/adyaapp/gsuite/serverless.yml
cp slack-serverless.yml target/dist/adyaapp/slack/serverless.yml

cd target/dist/adyaapp/core

sls create_domain --stage=$STAGE
sls deploy --DB_URL=$DB_URL --DB_USERNAME=$DB_USERNAME --DB_PWD=$DB_PWD --DB_NAME=$DB_NAME --stage=$STAGE

cd ../gsuite
sls deploy --DB_URL=$DB_URL --DB_USERNAME=$DB_USERNAME --DB_PWD=$DB_PWD --DB_NAME=$DB_NAME --stage=$STAGE

cd ../slack
sls deploy --DB_URL=$DB_URL --DB_USERNAME=$DB_USERNAME --DB_PWD=$DB_PWD --DB_NAME=$DB_NAME --stage=$STAGE