#!/bin/bash
path=$1
set -e

zowe zos-files list uss "$path" --host fakehost --pw fakepass --user fakeuser
if [ $? -gt 0 ]
then
    exit $?
fi