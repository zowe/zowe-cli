#!/bin/sh

# include zowe-cli\__tests__\__scripts__\exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/../../../../../../../../../../__tests__/__scripts__/exitOnFailure.sh

# copy our config file and certificate files
resourceDir=$myScriptDir/../__resources__
cp $resourceDir/base_cert.config.json imperative-test-cli.config.json
exitOnFailure "Failed to copy config file." $?

cp $resourceDir/fakeCert.cert .
exitOnFailure "Failed to copy certificate file." $?

cp $resourceDir/fakeKey.key .
exitOnFailure "Failed to copy certificate key file." $?

# login to fruit auth
echo Y | imperative-test-cli auth login fruit
exitOnFailure "Logging into auth of type fruit failed!" $?

# show contents of our config file
imperative-test-cli config list profiles
exitOnFailure "Display of updated imperative-test-cli.config.json failed!" $?
