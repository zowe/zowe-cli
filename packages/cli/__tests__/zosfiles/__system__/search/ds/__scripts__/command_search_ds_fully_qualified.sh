#!/bin/bash
DSN=$1
STERM=$2
HOST=$3
PORT=$4
USER=$5
PASS=$6
shift 6

zowe zos-files search ds "$DSN" "$STERM" --host $HOST --port $PORT --user $USER --password $PASS --ru=false $@
exit $?