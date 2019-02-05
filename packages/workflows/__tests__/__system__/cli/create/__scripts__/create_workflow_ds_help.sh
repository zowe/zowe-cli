#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS CREATE DATA-SET HELP==============="
bright zos-workflows create data-set --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS CREATE DATA-SET HELP RFJ==========="
bright zos-workflows create data-set --help --rfj
exit $?
