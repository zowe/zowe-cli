#!/bin/bash
set -e

echo "================Z/OS FILES UPLOAD DATA SET==============="
zowe zos-files upload file-to-data-set "$1" $2 --host fakehost --user fakeuser --pw fakepass $3 $4
if [ $? -gt 0 ]
then
    exit $?
fi