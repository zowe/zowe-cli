#!/bin/bash
HOST=$2
PORT=$3
USER=$4
PASS=$5

zowe zos-files download dsm "$1" --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?