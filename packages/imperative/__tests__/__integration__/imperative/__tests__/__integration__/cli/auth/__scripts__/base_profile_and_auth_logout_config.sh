#!/bin/bash

# Next logout of fruit auth
imperative-test-cli auth logout fruit
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Logging out of auth of type fruit failed!" 1>&2
    exit $CMDRC
fi

# Now show contents of base profile
imperative-test-cli config list
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Listing configs failed!" 1>&2
    exit $CMDRC
fi
