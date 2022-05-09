#!/bin/bash
dsn=$1
set -e

zowe zos-files view ds "$dsn" --host fakehost --pw fakepass --user fakeuser
if [ $? -gt 0 ]
then
    exit $?
fi