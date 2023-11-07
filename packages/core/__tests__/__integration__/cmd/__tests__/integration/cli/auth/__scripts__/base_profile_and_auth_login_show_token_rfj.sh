#!/bin/bash

# Next login to fruit auth
cmd-cli auth login fruit --st --rfj
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Logging into auth of type fruit failed!" 1>&2
    exit $CMDRC
fi
