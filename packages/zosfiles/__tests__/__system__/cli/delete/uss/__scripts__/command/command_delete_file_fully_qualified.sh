#!/bin/bash
ussname=$1
forsure=$2
HOST=$3
PORT=$4
USER=$5
PASS=$6
echo "================Z/OS FILES DELETE FILE FULLY SPECIFIED==============="
zowe zos-files delete uss-file "$ussname" $forsure --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?