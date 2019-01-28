#!/bin/bash
uss=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5
zowe zos-files download uf "$uss" --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?