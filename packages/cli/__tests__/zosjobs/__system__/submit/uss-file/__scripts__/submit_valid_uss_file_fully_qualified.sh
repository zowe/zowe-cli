#!/bin/bash

JCL=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5

# pass the uss file name as an argument to the script
zowe zos-jobs submit uss-file $JCL --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?
