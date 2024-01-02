#!/bin/sh

profileType=${1:?"First parm (profileType) is required."}
defaultProfName=${2:?"First parm (defaultProfName) is required."}

# include exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/exitOnFailure.sh

# This script expects that pre-existing profiles have already been copied to the test directory
mv profiles/$profileType/${profileType}_meta.yaml profiles/$profileType/${profileType}_meta_orig.yaml
exitOnFailure "Failed to backup '$profileType' meta file." $?

sed -e  "s/defaultProfile:.*/defaultProfile: $defaultProfName/" \
    < profiles/$profileType/${profileType}_meta_orig.yaml > profiles/$profileType/${profileType}_meta.yaml
exitOnFailure "Failed to set default profile to '$defaultProfName' for type '$profileType'." $?