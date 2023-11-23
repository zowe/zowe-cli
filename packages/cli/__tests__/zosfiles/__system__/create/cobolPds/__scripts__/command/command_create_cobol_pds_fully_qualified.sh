#!/bin/bash
hlq=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5
zowe zos-files create data-set-cobol "$hlq.test.data.set.cobol" --host $HOST --port $PORT --user $USER --password $PASS --ru=false
exit $?
