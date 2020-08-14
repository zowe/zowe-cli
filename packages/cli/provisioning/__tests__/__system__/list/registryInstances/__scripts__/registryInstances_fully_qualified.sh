#!/bin/bash
set -e

HOST=$1
PORT=$2
USER=$3
PASSWORD=$4

zowe provisioning list registry-instances --host $HOST --port $PORT --password $PASSWORD --user $USER --ru=false
if [ $? -gt 0 ]
then
    exit $?
fi

zowe pv ls ri --response-format-json --host $HOST --port $PORT --password $PASSWORD --user $USER --ru=false
exit $?
