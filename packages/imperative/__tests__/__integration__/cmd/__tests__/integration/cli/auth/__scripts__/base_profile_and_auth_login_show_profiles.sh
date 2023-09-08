#!/bin/bash

# Now show contents of base profile
cmd-cli profiles list base-profiles --sc
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Listing profiles of type base failed!" 1>&2
    exit $CMDRC
fi
