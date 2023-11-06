#!/bin/bash

# Next logout of fruit auth
cmd-cli auth lo fruit
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Logging out of auth of type fruit failed!" 1>&2
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
