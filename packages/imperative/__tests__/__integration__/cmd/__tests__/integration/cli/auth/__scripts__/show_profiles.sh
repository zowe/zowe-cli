#!/bin/sh
# This script must be called AFTER a script copies a config file into our test directory.

# include zowe-cli\__tests__\__scripts__\exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/../../../../../../../../../../__tests__/__scripts__/exitOnFailure.sh

# show contents of our config file
imperative-test-cli config list profiles
exitOnFailure "Display of updated imperative-test-cli.config.json failed!" $?
