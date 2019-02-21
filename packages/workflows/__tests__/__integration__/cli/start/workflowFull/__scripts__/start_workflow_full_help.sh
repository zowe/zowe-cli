#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS START WORKFLOW-FULL HELP==============="
bright zos-workflows start workflow-full --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS START WORKFLOW-FULL HELP RFJ==========="
bright zos-workflows start workflow-full --help --rfj
exit $?
