#!/bin/bash
hlq=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5
zowe zos-files create data-set-partitioned "$hlq.test.data.set.pds" --host $HOST --port $PORT --user $USER --pass $PASS --ru=false
exit $?