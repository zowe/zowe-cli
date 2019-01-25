#!/bin/bash
set -e

echo "================Z/OS CONSOLE ISSUE HELP==============="
bright zos-console issue --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CONSOLE ISSUE HELP WITH RFJ==========="
bright zos-console issue --help --rfj
exit $?
