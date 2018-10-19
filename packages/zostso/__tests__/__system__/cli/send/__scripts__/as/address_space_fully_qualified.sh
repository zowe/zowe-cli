#!/bin/bash
set -e

KEY=$1
HOST=$2
PORT=$3
USER=$4
PASSWORD=$5

# Start address space, if the command was successful, a servlet key will be received
zowe zos-tso send address-space $KEY --data "time" --host $HOST --port $PORT --user $USER --pass $PASSWORD --ru=false

exit $?
