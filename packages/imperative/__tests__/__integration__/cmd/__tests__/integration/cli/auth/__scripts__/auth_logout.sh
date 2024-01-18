#!/bin/sh

# include zowe-cli\__tests__\__scripts__\exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/../../../../../../../../../../__tests__/__scripts__/exitOnFailure.sh

imperative-test-cli auth logout fruit
exitOnFailure "Logging out auth of type fruit failed!" $?

# show contents of our config file
imperative-test-cli config list profiles
exitOnFailure "Display of updated imperative-test-cli.config.json failed!" $?
