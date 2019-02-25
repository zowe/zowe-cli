#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS ARCHIVE WORKFLOW HELP==============="
zowe zos-workflows archive w --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS ARCHIVE WORKFLOW HELP RFJ==========="
zowe zos-workflows archive w --help --rfj
exit $?
