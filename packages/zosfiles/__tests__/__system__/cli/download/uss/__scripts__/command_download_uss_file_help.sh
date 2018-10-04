#!/bin/bash
set -e

echo "================Z/OS FILES DOWNLOAD USS FILE HELP==============="
zowe zos-files download uss-file --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES DOWNLOAD USS FILE HELP WITH RFJ==========="
zowe zos-files download uss-file --help --rfj
exit $?