#!/bin/bash
set -e

echo "================Z/OS LOG HELP==============="
zowe zos-logs --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS LOG HELP WITH RFJ==========="
zowe zos-logs --help --rfj
exit $?
