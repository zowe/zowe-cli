#!/bin/bash
fsn=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5
set -e

echo "================Z/OS FILES UNMOUNT FILE SYSTEM==============="
zowe zos-files unmount file-system "$fsn" --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?