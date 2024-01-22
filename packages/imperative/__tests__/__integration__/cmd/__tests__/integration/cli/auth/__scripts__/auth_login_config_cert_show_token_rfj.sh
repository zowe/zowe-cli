#!/bin/sh

# include zowe-cli\__tests__\__scripts__\exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/../../../../../../../../../../__tests__/__scripts__/exitOnFailure.sh

# copy our config file
cp $myScriptDir/../__resources__/base_cert.config.json imperative-test-cli.config.json
exitOnFailure "Failed to copy config file." $?

# Login to fruit auth. Only show token. Do not store token.
imperative-test-cli auth login fruit --st --rfj
exitOnFailure "Logging into auth of type fruit failed!" $?
