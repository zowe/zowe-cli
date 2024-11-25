#!/bin/bash
dsn=$1
pattern=$2
HOST=$3
PORT=$4
USER=$5
PASS=$6
zowe zos-files download amm "$dsn" "$pattern" --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?