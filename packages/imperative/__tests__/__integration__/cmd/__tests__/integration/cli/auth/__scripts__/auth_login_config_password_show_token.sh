#!/bin/sh

# include zowe-cli\__tests__\__scripts__\exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/../../../../../../../../../../__tests__/__scripts__/exitOnFailure.sh

# copy our config file
cp $myScriptDir/../__resources__/base_password.config.json imperative-test-cli.config.json
exitOnFailure "Failed to copy config file." $?

# login to fruit auth
imperative-test-cli auth login fruit --show-token
exitOnFailure "Logging into auth of type fruit failed!" $?

# show contents of our config file
imperative-test-cli config list profiles
exitOnFailure "Display of updated imperative-test-cli.config.json failed!" $?
