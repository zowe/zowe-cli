#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS CREATE USS-FILE HELP==============="
zowe zos-workflows create workflow-from-uss-file --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS CREATE USS-FILE HELP RFJ==========="
zowe zos-workflows create workflow-from-uss-file --help --rfj
exit $?