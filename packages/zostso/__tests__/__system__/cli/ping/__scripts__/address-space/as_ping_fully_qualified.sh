#!/bin/bash
set -e

KEY=$1
HOST=$2
PORT=$3
USER=$4
PASSWORD=$5

zowe zos-tso ping address-space $KEY --host $HOST --port $PORT --user $USER --pass $PASSWORD --ru=false
exit $?