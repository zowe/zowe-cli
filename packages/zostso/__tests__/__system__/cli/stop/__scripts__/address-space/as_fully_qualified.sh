#!/bin/bash
set -e

ACCOUNT=$1
HOST=$2
PORT=$3
USER=$4
PASSWORD=$5

SERVLET_KEY=`zowe tso start as --account $ACCOUNT --host $HOST --port $PORT --user $USER --pass $PASSWORD | grep -oP "(?<=: ).*"`

zowe zos-tso stop address-space ${SERVLET_KEY} --account $ACCOUNT --host $HOST --port $PORT --user $USER --pass $PASSWORD
exit $?