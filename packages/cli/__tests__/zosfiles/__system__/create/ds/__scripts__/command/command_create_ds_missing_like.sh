#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DS==============="
zowe files create data-set "$1.test.data.set.dataSetType" --data-set-type PDS
if [ $? -gt 0 ]
then
    exit $?
fi
