#!/bin/bash
set -e

TEMPLATE=$1
HOST=$2
PORT=$3
USER=$4
PASSWORD=$5

zowe provisioning list template-info $TEMPLATE --host $HOST --user $USER --port $PORT --password $PASSWORD --ru=false
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls ti $TEMPLATE --response-format-json --host $HOST --user $USER --port $PORT --password $PASSWORD --ru=false
exit $?
