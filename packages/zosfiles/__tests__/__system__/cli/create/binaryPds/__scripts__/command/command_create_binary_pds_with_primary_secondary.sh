#!/bin/bash
hlq1=$1
set -e

echo "================Z/OS FILES CREATE DATA-SET-BINARY==============="
zowe zos-files create data-set-partitioned "$1.test.data.set.binary.second" --ps 20 --ss 20 --pa
if [ $? -gt 0 ]
then
    exit $?
fi
