#!/bin/bash
set -e

TEMPLATE=$1
HOST=$2
PORT=$3
USER=$4
PASSWORD=$5

zowe provisioning prov template $TEMPLATE --host $HOST --port $PORT --password $PASSWORD --user $USER --ru=false
exit $?
