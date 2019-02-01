#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS DELETE WORKFLOW-KEY HELP==============="
bright zos-workflows delete workflow-key --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS DELETE WORKFLOW-KEY HELP RFJ==========="
bright zos-workflows delete workflow-key --help --rfj
exit $?
