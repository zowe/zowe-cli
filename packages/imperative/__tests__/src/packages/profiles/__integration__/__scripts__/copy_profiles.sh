#!/bin/sh

# include zowe-cli\__tests__\__scripts__\exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/../../../../../../../../__tests__/__scripts__/exitOnFailure.sh

# copy pre-existing profiles to test directory
cp -r $myScriptDir/../__resources__/profiles profiles
exitOnFailure "Failed to copy test profile." $?
