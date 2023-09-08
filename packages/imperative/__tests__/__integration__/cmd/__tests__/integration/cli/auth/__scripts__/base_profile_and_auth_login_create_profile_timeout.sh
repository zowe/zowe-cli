#!/bin/bash

baseUser=$1
basePass=$2

cmd-cli auth login fruit --user "$baseUser" --password "$basePass"
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Logging into auth of type fruit failed!" 1>&2
    exit $CMDRC
fi