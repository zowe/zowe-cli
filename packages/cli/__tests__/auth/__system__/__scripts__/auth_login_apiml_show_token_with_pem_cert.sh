#!/bin/bash
set -e

HOST=$1
PORT=$2
CERT=$3
KEY=$4
REJECT=$5
SHOWTOKEN=$6

zowe auth login apiml --host $HOST --port $PORT --certFile $CERT --certKeyFile $KEY --ru $REJECT --st $SHOWTOKEN

exit $?