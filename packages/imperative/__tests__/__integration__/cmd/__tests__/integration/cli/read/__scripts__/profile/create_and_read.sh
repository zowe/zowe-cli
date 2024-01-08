#!/bin/sh

# include exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/exitOnFailure.sh

# copy pre-existing profiles to test directory
cp -r $myScriptDir/../__resources__/profiles profiles
exitOnFailure "Failed to copy test profile." $?

# read the profile and display its information
cmd-cli read profile
exitOnFailure "Failed display profile." $?
