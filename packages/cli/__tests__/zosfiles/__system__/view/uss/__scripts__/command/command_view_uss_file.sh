#!/bin/bash
dsn=$1
rfj=$2
set -e

zowe files view uss-file "$1" $2 $3
if [ $? -gt 0 ]
then
    exit $?
fi
