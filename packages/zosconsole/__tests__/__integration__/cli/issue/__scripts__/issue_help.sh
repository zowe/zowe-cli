#!/bin/bash
set -e

echo "================Z/OS CONSOLE ISSUE HELP==============="
zowe zos-console issue --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CONSOLE ISSUE HELP WITH RFJ==========="
zowe zos-console issue --help --rfj
exit $?
