#!/bin/bash
set -e

echo "================Z/OS COLLECT HELP==============="
zowe zos-console collect --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS COLLECT HELP WITH RFJ==========="
zowe zos-console collect --help --rfj
exit $?
