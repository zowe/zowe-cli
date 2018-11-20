#!/bin/bash
dsn=$1

set -e

zowe zos-files list am "$dsn" --host fakehost --user fakeuser --pw fakepass
if [ $? -gt 0 ]
then
    exit $?
fi