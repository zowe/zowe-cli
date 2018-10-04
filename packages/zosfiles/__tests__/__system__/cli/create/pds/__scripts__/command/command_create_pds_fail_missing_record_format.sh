#!/bin/bash
hlq=$1
set -e

echo "================Z/OS FILES CREATE PDS==============="
zowe zos-files create data-set-partitioned "$1.test.data.set.pds" --record-format
if [ $? -gt 0 ]
then
    exit $?
fi
