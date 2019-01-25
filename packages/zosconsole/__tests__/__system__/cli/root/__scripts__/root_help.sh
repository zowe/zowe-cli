#!/bin/bash
set -e

echo "================Z/OS CONSOLE HELP==============="
bright zos-console --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS CONSOLE HELP WITH RFJ==========="
bright zos-console --help --rfj
exit $?
