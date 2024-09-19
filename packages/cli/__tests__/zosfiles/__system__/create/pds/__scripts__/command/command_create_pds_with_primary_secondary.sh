#!/bin/bash
hlq1=$1
set -e

echo "================Z/OS FILES CREATE PDS==============="
zowe zos-files create pds "$1.test.data.set.pds.second" --ps 20 --ss 5 --attributes
if [ $? -gt 0 ]
then
    exit $?
fi
