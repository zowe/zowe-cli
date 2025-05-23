#!/bin/bash
hlq1=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-BINARY==============="
zowe zos-files create data-set-partitioned "$1.data.set.binary.size" --size 2CYL --attributes
if [ $? -gt 0 ]
then
    exit $?
fi
