#!/bin/bash
set -e

HOST=$1
PORT=$2
USER=$3
PASSWORD=$4
ACCOUNT=$5

zowe zos-tso issue command "time" --host $HOST --port $PORT --user $USER --pass $PASSWORD --account $ACCOUNT --ru=false

exit $?