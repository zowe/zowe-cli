#!/bin/bash
set -e

echo "================ Z/OS FILES UPLOAD DIRECTORY HELP ==============="
bright zos-files upload dir-to-pds --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================ Z/OS FILES UPLOAD DIRECTORY HELP WITH RFJ ==========="
bright zos-files upload dir-to-pds --help --rfj
exit $?