#!/bin/bash
set -e

echo "================Z/OS WORKFLOWS LIST DEFINITION-FILE-DETAILS HELP==============="
zowe zos-workflows list definition-file-details --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS WORKFLOWS LIST DEFINITION-FILE-DETAILS HELP RFJ==========="
zowe zos-workflows list definition-file-details --help --rfj
exit $?
