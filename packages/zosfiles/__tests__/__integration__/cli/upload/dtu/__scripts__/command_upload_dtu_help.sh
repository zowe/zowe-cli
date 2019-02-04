#!/bin/bash
set -e

echo "================ Z/OS FILES UPLOAD LOCAL DIRECTORY TO USS DIRECTORY HELP==============="
zowe zos-files upload file-to-uss --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================ Z/OS FILES UPLOAD LOCAL DIRECTORY TO USS DIRECTORY HELP WITH RFJ==============="
zowe zos-files upload file-to-uss --help --rfj
exit $?