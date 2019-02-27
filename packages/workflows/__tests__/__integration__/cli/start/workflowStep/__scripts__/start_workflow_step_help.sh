#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-STEP HELP==============="
bright zos-workflows start workflow-step --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS START WORKFLOW-STEP HELP RFJ==========="
bright zos-workflows start workflow-step --help --rfj
exit $?
