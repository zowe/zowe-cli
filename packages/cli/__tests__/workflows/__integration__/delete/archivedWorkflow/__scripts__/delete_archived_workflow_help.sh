#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS DELETE ARCHIVED-WORKFLOW HELP==============="
zowe zos-workflows delete archived-workflow --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS DELETE ARCHIVED-WORKFLOW HELP RFJ==========="
zowe zos-workflows delete archived-workflow --help --rfj
exit $?
