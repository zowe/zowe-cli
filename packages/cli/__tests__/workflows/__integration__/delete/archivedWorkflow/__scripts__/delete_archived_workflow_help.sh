#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS DELETE ARCHIVED-WORKFLOW HELP==============="
bright zos-workflows delete archived-workflow --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS DELETE ARCHIVED-WORKFLOW HELP RFJ==========="
bright zos-workflows delete archived-workflow --help --rfj
exit $?
