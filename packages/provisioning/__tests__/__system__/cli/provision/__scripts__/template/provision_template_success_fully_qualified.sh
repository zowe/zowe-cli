#!/bin/bash
set -e

TEMPLATE=$1
ACCOUNT=$2
HOST=$3
PORT=$4
USER=$5
PASSWORD=$6

zowe provisioning prov template $TEMPLATE --ai $ACCOUNT --host $HOST --port $PORT --password $PASSWORD --user $USER --ru=false
exit $?
