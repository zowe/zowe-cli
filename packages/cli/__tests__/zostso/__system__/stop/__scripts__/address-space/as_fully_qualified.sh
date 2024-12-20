#!/bin/bash
set -e

ACCOUNT=$1
HOST=$2
PORT=$3
USER=$4
PASSWORD=$5

# SERVLET_KEY=`zowe tso start as --host $HOST --account $ACCOUNT --port $PORT --user $USER --password $PASSWORD --ru=false | grep -oP "(?<=: ).*"`
SERVLET_KEY=`zowe tso start as --host $HOST --account $ACCOUNT --port $PORT --user $USER --password $PASSWORD --ru=false | awk -F': ' '{print $2}' | sed '1p;d'`

zowe zos-tso stop address-space ${SERVLET_KEY} --host $HOST --port $PORT --user $USER --password $PASSWORD --ru=false
exit $?