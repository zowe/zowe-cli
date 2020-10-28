#!/bin/bash
set -e

echo "================ Z/OS FILES UPLOAD DIRECTORY HELP ==============="
zowe zos-files upload dir-to-pds --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================ Z/OS FILES UPLOAD DIRECTORY HELP WITH RFJ ==========="
zowe zos-files upload dir-to-pds --help --rfj
exit $?