#!/bin/bash

# Set the log level according to the input parameters
LOGLEVEL=$1
export ZOWE_IMPERATIVE_LOG_LEVEL=$LOGLEVEL
export ZOWE_APP_LOG_LEVEL=$LOGLEVEL

# Get z/OSMF Info 
zowe zosmf check status
CMDRC=$?
if [ $CMDRC -ne 0 ]
then
    echo "Check status command returned a non-zero RC: $CMDRC" 1>&2
    exit $CMDRC
fi

# Issue a console command 
zowe console issue cmd "D IPLINFO"
CMDRC=$?
if [ $CMDRC -ne 0 ]
then
    echo "List jobs command returned a non-zero RC: $CMDRC" 1>&2
    exit $CMDRC
fi

# List my jobs 
zowe jobs ls jobs
CMDRC=$?
if [ $CMDRC -ne 0 ]
then
    echo "List jobs command returned a non-zero RC: $CMDRC" 1>&2
    exit $CMDRC
fi
