#!/bin/bash
set -e

echo "================Z/OS FILES DOWNLOAD USS DIRECTORY HELP==============="
zowe zos-files download uss-dir --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES DOWNLOAD USS DIRECTORY HELP WITH RFJ==========="
zowe zos-files download uss-dir --help --rfj
exit $?