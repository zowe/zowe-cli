#!/bin/bash
set -e

INSTANCE=$1
HOST=$2
PORT=$3
USER=$4
PASSWORD=$5

zowe provisioning list instance-variables $INSTANCE --host $HOST --pass $PASSWORD --user $USER --port $PORT --ru=false
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls iv $INSTANCE --response-format-json --host $HOST --pass $PASSWORD --user $USER --port $PORT --ru=false
exit $?
