#!/bin/bash

baseUser=$1
basePass=$2

# First create a base profile
cmd-cli profiles create base-profile "test_base" --user "$baseUser" --password "$basePass"
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Creating a test_base profile of type base failed!" 1>&2
    exit $CMDRC
fi
