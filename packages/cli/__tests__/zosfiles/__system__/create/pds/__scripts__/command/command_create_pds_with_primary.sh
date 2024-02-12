#!/bin/bash
hlq1=$1
set -e

echo "================Z/OS FILES CREATE PDS==============="
zowe zos-files create pds "$1.test.data.set.pds.primary" --ps 20 --attributes
if [ $? -gt 0 ]
then
    exit $?
fi
