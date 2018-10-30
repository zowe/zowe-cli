#!/bin/bash
set -e

HOST=$1
PORT=$2
USER=$3
PASSWORD=$4

zowe provisioning list catalog-templates --host $HOST --pass $PASSWORD --user $USER --port $PORT --ru=false
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls ct --host $HOST --pass $PASSWORD --user $USER --port $PORT --ru=false --response-format-json
exit $?
