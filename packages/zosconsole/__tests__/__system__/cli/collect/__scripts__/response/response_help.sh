#!/bin/bash
set -e

echo "================Z/OS COLLECT RESPONSE HELP==============="
bright zos-console collect sync-responses --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS COLLECT HELP WITH RFJ==========="
bright zos-console collect sync-responses --help --rfj
exit $?
