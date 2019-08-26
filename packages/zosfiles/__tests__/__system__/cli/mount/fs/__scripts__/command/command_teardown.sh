#!/bin/bash
cmd=$1
fsn=$2
HOST=$3
PORT=$4
USER=$5
PASS=$6
set -e

echo "================Z/OS USS ISSUE SSH==============="
zowe zos-uss issue ssh "$cmd" --host $HOST --port $PORT --user $USER --password $PASS
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES DELETE ZOS-FILE-SYSTEM==============="
zowe zos-files delete zos-file-system "$fsn"
exit $?
