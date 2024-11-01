#!/bin/bash

zowe jobs search job "$1"
RC=$?
if [ $RC -gt 0 ]; then
    echo "The search spool job command returned a non-zero rc: $RC" 1>&2
    exit $RC
fi
