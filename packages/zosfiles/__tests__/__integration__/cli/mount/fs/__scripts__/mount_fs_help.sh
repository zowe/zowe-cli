#!/bin/bash
set -e

echo "================Z/OS FILES MOUNT FILE-SYSTEM HELP==============="
zowe zos-files mount fs --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES MOUNT FILE-SYSTEM HELP WITH RFJ==========="
zowe zos-files mount fs --help --rfj
exit $?
