#!/bin/bash
set -e

INSTANCE=$1
HOST=$2
PORT=$3
USER=$4
PASSWORD=$5

zowe provisioning delete instance $INSTANCE --host $HOST --password $PASSWORD --user $USER --port $PORT --ru=false
exit $?