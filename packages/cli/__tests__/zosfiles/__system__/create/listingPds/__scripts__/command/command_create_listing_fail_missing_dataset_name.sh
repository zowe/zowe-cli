#!/bin/bash
set -e

echo "================Z/OS FILES CREATE PDS==============="
zowe zos-files create data-set-listing
if [ $? -gt 0 ]
then
    exit $?
fi
