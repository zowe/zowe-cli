#!/bin/bash
ufn=$1
two=$2
thr=$3
set -e

echo "================Z/OS FILES DOWNLOAD USS FILE==============="
zowe files download uss-directory "$1" $2 $3
if [ $? -gt 0 ]
then
    exit $?
fi