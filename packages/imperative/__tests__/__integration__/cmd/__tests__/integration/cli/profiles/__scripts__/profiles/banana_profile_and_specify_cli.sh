#!/bin/bash

color=$1
description=$2
moldtype=$3

cliColor=$4
cliDescription=$5
cliMoldType=$6
# First create a banana profile
cmd-cli profiles create banana-profile "test_banana" --color "$color" --banana-description "$description" --mold-type "$moldtype"
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Creating a test_banana profile of type banana failed!" 1>&2
    exit $CMDRC
fi

cmd-cli profile mapping --color "$cliColor" --banana-description "$cliDescription" --mold-type "$cliMoldType"
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Profile mapping command failed!" 1>&2
    exit $CMDRC
fi
