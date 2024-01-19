#!/bin/sh

# include zowe-cli\__tests__\__scripts__\exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/../../../../../../../../../../../__tests__/__scripts__/exitOnFailure.sh

# copy pre-existing profiles to test directory
cp -r $myScriptDir/../__resources__/profiles profiles
exitOnFailure "Failed to copy test profile." $?

# read the profile and display its information
cmd-cli read profile
exitOnFailure "Failed display profile." $?
