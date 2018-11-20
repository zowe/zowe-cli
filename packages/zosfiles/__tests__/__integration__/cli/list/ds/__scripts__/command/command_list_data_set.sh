#!/bin/bash
dsn=$1
set -e

zowe zos-files list ds "$dsn" --host fakehost --pw fakepass --user fakeuser
if [ $? -gt 0 ]
then
    exit $?
fi