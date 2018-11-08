#!/bin/bash
set -e

echo "================Z/OS CONSOLE ISSUE COMMAND HELP==============="
zowe zos-console issue command --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CONSOLE ISSUE COMMAND HELP WITH RFJ==========="
zowe zos-console issue command --help --rfj
exit $?
