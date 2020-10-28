#!/bin/bash
set -e

echo "================Z/OS CONSOLE HELP==============="
zowe zos-console --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CONSOLE HELP WITH RFJ==========="
zowe zos-console --help --rfj
exit $?
