#!/bin/sh

# include exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/exitOnFailure.sh

# set -e
# OUTPUT=$(cmd-cli profiles create insecure "test_insecure" --info "some info" --secret "not so secret info")

# copy pre-existing profile to test directory
cp -r $myScriptDir/../__resources__/profiles profiles
exitOnFailure "Failed to copy test profile." $?

# read the profile and display its information
cmd-cli read profile
exitOnFailure "Failed display profile." $?
