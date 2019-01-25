#!/bin/bash
set -e

echo "================Z/OS FILES CREATE PDS==============="
bright zos-files create data-set-partitioned
if [ $? -gt 0 ]
then
    exit $?
fi
