#!/bin/bash
set -e

ACCOUNT=$1
HOST=$2
PORT=$3
USER=$4
PASSWORD=$5

# Start address space, if the command was successful, servlet key will be received
zowe tso start as --account $ACCOUNT --host $HOST --port $PORT --user $USER --password $PASSWORD --ru=false

exit $?