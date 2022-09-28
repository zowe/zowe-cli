#!/bin/bash

# Set the log level according to the input parameters
LOGLEVEL=$1
PASSWORD=$2
export ZOWE_IMPERATIVE_LOG_LEVEL=$LOGLEVEL
export ZOWE_APP_LOG_LEVEL=$LOGLEVEL

# Get z/OSMF Info 
zowe zosmf check status --pw $PASSWORD
CMDRC=$?
if [ $CMDRC -ne 0 ]
then
    echo "Check status command returned a non-zero RC: $CMDRC" 1>&2
    exit $CMDRC
fi

# Get z/OSMF Info
zowe zosmf check status --pass $PASSWORD
CMDRC=$?
if [ $CMDRC -ne 0 ]
then
    echo "Check status command returned a non-zero RC: $CMDRC" 1>&2
    exit $CMDRC
fi

# Get z/OSMF Info
zowe zosmf check status --password $PASSWORD
CMDRC=$?
if [ $CMDRC -ne 0 ]
then
    echo "Check status command returned a non-zero RC: $CMDRC" 1>&2
    exit $CMDRC
fi