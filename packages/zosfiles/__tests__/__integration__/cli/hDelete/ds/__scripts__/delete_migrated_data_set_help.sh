#!/bin/bash
set -e

echo "================Z/OS FILES DELETE MIGRATED DATA-SET-SEQUENTIAL HELP==============="
zowe zos-files hDelete data-set --help
if [ $? -gt 0 ]
then
    exit $?
fi
