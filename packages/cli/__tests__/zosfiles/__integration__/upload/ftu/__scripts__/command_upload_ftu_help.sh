#!/bin/bash
set -e

echo "================Z/OS FILES UPLOAD DATA SET HELP==============="
zowe zos-files upload file-to-uss --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES UPLOAD DATA SET HELP WITH RFJ==========="
zowe zos-files upload file-to-uss --help --rfj
exit $?