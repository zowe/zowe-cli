#!/bin/bash
dsn=$1
two=$2
thr=$3
set -e

zowe zos-files list am "$1" $2 $3
if [ $? -gt 0 ]
then
    exit $?
fi