#!/bin/bash
set -e

echo "================Z/OS CONSOLE ISSUE COMMAND HELP==============="
bright zos-console issue command --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CONSOLE ISSUE COMMAND HELP WITH RFJ==========="
bright zos-console issue command --help --rfj
exit $?
