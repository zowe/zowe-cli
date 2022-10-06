#!/bin/bash
set -e

echo "================Z/OS LOG LIST LOGS HELP==============="
zowe zos-logs list logs --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS LOG LIST LOGS HELP WITH RFJ==========="
zowe zos-logs list logs --help --rfj
exit $?
