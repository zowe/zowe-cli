#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS DELETE ACTIVE-WORKFLOW HELP==============="
bright zos-workflows delete active-workflow --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS DELETE ACTIVE-WORKFLOW HELP RFJ==========="
bright zos-workflows delete active-workflow --help --rfj
exit $?
