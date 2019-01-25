#!/bin/bash
dsn=$1
forsure=$2
rfj=$3
set -e

echo "================Z/OS FILES DELETE VSAM DATA SET==============="
bright zos-files delete data-set-vsam "$1" $2 $3
if [ $? -gt 0 ]
then
    exit $?
fi
