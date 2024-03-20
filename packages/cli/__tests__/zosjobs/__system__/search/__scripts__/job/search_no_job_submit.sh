#!/bin/bash

zowe jobs search job "$1" $2
RC=$?
if [ $RC -gt 0 ]
then
    echo $STATUS 1>&2
    echo "The search spool job command returned a non-zero rc: $RC" 1>&2
    exit $RC
fi

