#!/bin/bash
set -e

echo "================Z/OS FILES MIGRATE DATA-SET-SEQUENTIAL HELP==============="
zowe zos-files hMigrate data-set --help --rfj
if [ $? -gt 0 ]
then
    exit $?
fi
