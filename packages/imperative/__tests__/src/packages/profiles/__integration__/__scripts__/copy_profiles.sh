#!/bin/sh

# include exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/exitOnFailure.sh

# copy pre-existing profiles to test directory
cp -r $myScriptDir/../__resources__/profiles profiles
exitOnFailure "Failed to copy test profile." $?
