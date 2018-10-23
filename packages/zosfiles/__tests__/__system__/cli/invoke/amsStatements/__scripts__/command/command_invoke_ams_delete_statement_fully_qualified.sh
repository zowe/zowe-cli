#!/bin/bash
HLQ=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5
zowe zos-files invoke ams-statements "DELETE $HLQ.TEST.VSAM.DATA.SET CLUSTER" --host $HOST --port $PORT --user $USER --pass $PASS --ru=false
exit $?