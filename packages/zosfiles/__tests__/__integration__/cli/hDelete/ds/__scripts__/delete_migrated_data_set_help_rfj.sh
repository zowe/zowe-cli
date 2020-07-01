#!/bin/bash
set -e

echo "================Z/OS FILES DELETE MIGRATED DATA-SET-SEQUENTIAL HELP==============="
zowe zos-files hDelete data-set --help --rfj
if [ $? -gt 0 ]
then
    exit $?
fi
