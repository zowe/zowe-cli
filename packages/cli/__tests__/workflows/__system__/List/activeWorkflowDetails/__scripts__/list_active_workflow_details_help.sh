#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS LIST ACTIVE-WORKFLOW-DETAILS HELP==============="
zowe zos-workflows list active-workflow-details --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS LIST ACTIVE-WORKFLOW-DETAILS HELP RFJ==========="
zowe zos-workflows list active-workflow-details --help --rfj
exit $?
