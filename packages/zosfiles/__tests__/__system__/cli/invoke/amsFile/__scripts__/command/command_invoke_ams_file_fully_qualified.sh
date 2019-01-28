#!/bin/bash
AMS=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5
zowe zos-files invoke ams-file "$AMS" --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?