#!/bin/bash
path=$1
set -e

zowe zos-files view uss-file "$path" --host fakehost --pw fakepass --user fakeuser
if [ $? -gt 0 ]
then
    exit $?
fi