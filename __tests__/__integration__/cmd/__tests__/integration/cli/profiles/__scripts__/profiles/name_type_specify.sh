#!/bin/bash

color=$1
description=$2
moldtype=$3
# First create a banana profile
cmd-cli profiles create banana-profile "test_banana" --color "$color" --banana-description "$description" --mold-type "$moldtype"
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Creating a test_banana profile of type banana failed!" 1>&2
    exit $CMDRC
fi
 cliName=$4
cliType=$5
# should print the name and type that are specified, not the profile name or type
cmd-cli profile mapping-name-type "$cliName" --type "$cliType"
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Profile mapping command failed!" 1>&2
    exit $CMDRC
fi