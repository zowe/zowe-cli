#!/bin/bash
set -e

echo "================Z/OS FILES CREATE HELP==============="
zowe zos-files delete uss-file --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CFILES CREATE HELP WITH RFJ==========="
zowe zos-files delete uss-file --help --rfj
exit $?
