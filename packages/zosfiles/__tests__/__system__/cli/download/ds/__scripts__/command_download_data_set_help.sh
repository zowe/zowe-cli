#!/bin/bash
set -e

echo "================Z/OS FILES DOWNLOAD DATA SET HELP==============="
zowe zos-files download ds --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CFILES DOWNLOAD DATA SET HELP WITH RFJ==========="
zowe zos-files download ds --help --rfj
exit $?