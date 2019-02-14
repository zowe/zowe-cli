#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-KEY HELP==============="
bright zos-workflows start workflow-with-workflow-key --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS START WORKFLOW-KEY HELP RFJ==========="
bright zos-workflows start workflow-with-workflow-key --help --rfj
exit $?
