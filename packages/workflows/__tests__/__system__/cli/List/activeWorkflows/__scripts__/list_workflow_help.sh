#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS LIST WORKFLOWS HELP==============="
zowe zos-workflows list acw --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS LIST WORKFLOWS HELP RFJ==========="
zowe zos-workflows list acw --help --rfj
exit $?
