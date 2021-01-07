#!/bin/bash
set -e

HOST=$1
PORT=$2
USER=$3
PASS=$4

RESPONSE_KEY=`zowe zos-console issue command "D T" -k --host $HOST --password $PASS --user $USER --port $PORT --ru=false`

zowe zos-console collect sync-responses $RESPONSE_KEY --host $HOST --password $PASS --user $USER --port $PORT --ru=false
exit $?
