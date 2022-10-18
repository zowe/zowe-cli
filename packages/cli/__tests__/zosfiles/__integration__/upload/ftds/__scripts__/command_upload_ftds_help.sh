#!/bin/bash
set -e

echo "================Z/OS FILES UPLOAD DATA SET HELP==============="
zowe zos-files upload file-to-data-set --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES UPLOAD DATA SET HELP WITH RFJ==========="
zowe zos-files upload file-to-data-set --help --rfj
exit $?