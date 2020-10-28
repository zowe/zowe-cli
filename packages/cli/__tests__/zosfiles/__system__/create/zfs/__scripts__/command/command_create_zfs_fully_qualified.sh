#!/bin/bash
fsn=$1
vols=$2
HOST=$3
PORT=$4
USER=$5
PASS=$6
zowe zos-files create data-set-vsam "$fsn" --volumes $vols --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?