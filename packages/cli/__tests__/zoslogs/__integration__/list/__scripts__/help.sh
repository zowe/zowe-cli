#!/bin/bash
set -e

echo "================Z/OS LOG LIST HELP==============="
zowe zos-logs list --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS LOG LIST HELP WITH RFJ==========="
zowe zos-logs list --help --rfj
exit $?
