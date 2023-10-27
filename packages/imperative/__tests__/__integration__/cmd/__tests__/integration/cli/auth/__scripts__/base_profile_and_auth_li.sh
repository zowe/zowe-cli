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

# Next login to fruit auth
cmd-cli auth li fruit
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Logging into auth of type fruit failed!" 1>&2
    exit $CMDRC
fi

# Now show contents of base profile
cmd-cli profiles list base-profiles --sc
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Listing profiles of type base failed!" 1>&2
    exit $CMDRC
fi
