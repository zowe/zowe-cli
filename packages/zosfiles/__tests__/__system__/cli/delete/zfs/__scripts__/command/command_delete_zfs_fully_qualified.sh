#!/bin/bash
fsn=$1
forsure=$2
HOST=$3
PORT=$4
USER=$5
PASS=$6
set -e

echo "================Z/OS FILES DELETE Z/OS FILE SYSTEM==============="
zowe zos-files delete zos-file-system "$fsn" $forsure --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?