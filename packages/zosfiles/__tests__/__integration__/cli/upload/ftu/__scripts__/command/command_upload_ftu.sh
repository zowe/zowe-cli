#!/bin/bash
set -e

echo "================Z/OS FILES UPLOAD USS FILE==============="
zowe zos-files upload file-to-uss "$1" "$2" --host fakehost --user fakeuser --pw fakepass
if [ $? -gt 0 ]
then
    exit $?
fi