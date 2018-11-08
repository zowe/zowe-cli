#!/bin/bash
set -e

echo "================Z/OS FILES UPLOAD DATA SET==============="
zowe zos-files upload file-to-data-set "$1" $2 --host fakehost --user fakeuser --pw fakepass
if [ $? -gt 0 ]
then
    exit $?
fi