#!/bin/bash

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
sls deploy