#!/bin/bash
set -e

INSTANCE=$1
HOST=$2
PORT=$3
USER=$4
PASSWORD=$5

zowe provisioning list instance-info $INSTANCE --host $HOST --pass $PASSWORD --user $USER --port $PORT --ru=false
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls ii $INSTANCE --host $HOST --pass $PASSWORD --user $USER --port $PORT --response-format-json --ru=false
exit $?