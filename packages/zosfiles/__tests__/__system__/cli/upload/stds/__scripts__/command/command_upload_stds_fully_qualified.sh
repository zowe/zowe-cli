#!/bin/bash
set -e
zosFile=$1
HOST=$2
PORT=$3
USER=$4
PASS=$5
shift

echo "========= Z/OS FILES UPLOAD FROM STDIN ========="
cat << ___ENDCAT | zowe zos-files upload stdin-to-data-set "$zosFile" --host $HOST --port $PORT --user $USER --password $PASS --ru=false
This text was uploaded through standard input on
`date`
___ENDCAT

if [ $? -gt 0 ]
then
    exit $?
fi
