#!/bin/bash

echoVal=$1
baseUser=$2
basePass=$3

echo $echoVal | cmd-cli auth login fruit --user "$baseUser" --password "$basePass"
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Logging into auth of type fruit failed!" 1>&2
    exit $CMDRC
fi