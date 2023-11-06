#!/bin/bash

# Now show contents of base profile
imperative-test-cli config list
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Listing config failed!" 1>&2
    exit $CMDRC
fi
