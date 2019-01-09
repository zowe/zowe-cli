#!/bin/bash
FILE=$1
uss=$2
HOST=$3
PORT=$4
USER=$5
PASS=$6
zowe zos-files upload file-to-uss "$FILE" "$uss" --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?