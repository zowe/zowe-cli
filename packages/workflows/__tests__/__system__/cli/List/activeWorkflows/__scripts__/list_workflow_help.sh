#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS LIST WORKFLOWS HELP==============="
zowe zos-workflows list act --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS LIST WORKFLOWS HELP RFJ==========="
zowe zos-workflows list act --help --rfj
exit $?
