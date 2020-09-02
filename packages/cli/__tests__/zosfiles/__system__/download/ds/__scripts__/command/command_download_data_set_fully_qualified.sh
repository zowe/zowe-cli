#!/bin/bash
dsn=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5
zowe zos-files download ds "$dsn" --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?