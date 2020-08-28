#!/bin/bash
set -e

echo "================ Z/OS FILES UPLOAD LOCAL DIRECTORY ==============="
zowe zos-files upload dir-to-pds $*
if [ $? -gt 0 ]
then
    exit $?
fi