#!/bin/bash
path=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5
zowe zos-files list uss "$path" --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?