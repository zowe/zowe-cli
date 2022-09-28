#!/bin/bash
HLQ=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5
VOLSER=$6
zowe zos-files invoke ams-statements "DEFINE CLUSTER (NAME ($HLQ.TEST.VSAM.DATA.SET) CYLINDERS (5 2 ) VOLUMES($VOLSER))" --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?