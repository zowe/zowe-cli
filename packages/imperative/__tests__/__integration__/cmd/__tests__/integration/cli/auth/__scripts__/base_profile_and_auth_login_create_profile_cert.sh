#!/bin/bash

echoVal=$1
baseCertFile=$2
baseCertKey=$3

echo $echoVal | cmd-cli auth login fruit --certFile "$baseCertFile" --certKeyFile "$baseCertKey"
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Logging into auth of type fruit failed!" 1>&2
    exit $CMDRC
fi