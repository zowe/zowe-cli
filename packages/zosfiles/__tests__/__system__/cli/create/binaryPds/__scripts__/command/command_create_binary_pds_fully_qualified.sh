#!/bin/bash
hlq=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5
zowe zos-files create data-set-binary "$hlq.test.data.set.binary" --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?