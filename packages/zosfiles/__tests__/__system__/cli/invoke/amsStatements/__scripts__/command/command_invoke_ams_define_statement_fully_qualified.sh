#!/bin/bash
HLQ=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5
zowe zos-files invoke ams-statements "DEFINE CLUSTER (NAME ($HLQ.TEST.VSAM.DATA.SET) CYLINDERS (5 2 ) VOLUMES(STG100))" --host $HOST --port $PORT --user $USER --pass $PASS --ru=false
exit $?