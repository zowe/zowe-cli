#!/bin/bash
fsn=$1
mp=$2
HOST=$3
PORT=$4
USER=$5
PASS=$6
set -e

echo "================Z/OS FILES MOUNT FILE-SYSTEM==============="
zowe zos-files mount file-system "$fsn" "$mp" --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?