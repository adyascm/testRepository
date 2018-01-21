#!/bin/bash

#clean up
rm -rf target/dist/adyaapp &> /dev/null
mkdir target &> /dev/null
mkdir target/dist &> /dev/null
mkdir target/dist/adyaapp &> /dev/null

cp -r adya target/dist/adyaapp
mv target/dist/adyaapp/adya/lib/lib/python2.7/site-packages/* target/dist/adyaapp
rm -rf target/dist/adyaapp/adya/lib

cp serverless.yml target/dist/adyaapp/
cd target/dist/adyaapp

sls deploy