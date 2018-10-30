#!/bin/bash
dsn=$1
volume=$2
HOST=$3
PORT=$4
USER=$5
PASS=$6
zowe zos-files create data-set-vsam "$dsn" $volume --host $HOST --port $PORT --user $USER --pass $PASS --ru=false
exit $?