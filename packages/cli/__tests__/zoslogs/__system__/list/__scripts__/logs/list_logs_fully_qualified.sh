#!/bin/bash
set -e
HOST=$1
PORT=$2
USER=$3
PASS=$4
zowe zos-logs list logs --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?