#!/bin/bash

#Environment settings
DB_URL=${1:-'localhost:3306'}
DB_USERNAME=${2:-'root'}
DB_PWD=${3:-'root'}
DB_NAME=${4:-'dev'}

#clean up
rm -rf target/dist/adyaapp &> /dev/null
mkdir target &> /dev/null
mkdir target/dist &> /dev/null
mkdir target/dist/adyaapp &> /dev/null

cp -r adya target/dist/adyaapp
mv lib/lib/python2.7/site-packages/* target/dist/adyaapp

cp serverless.yml target/dist/adyaapp/
cd target/dist/adyaapp

echo "Deploying using serverless with dev profile"
sls create_domain
sls deploy --DB_URL=$DB_URL --DB_USERNAME=$DB_USERNAME --DB_PWD=$DB_PWD --DB_NAME=$DB_NAME