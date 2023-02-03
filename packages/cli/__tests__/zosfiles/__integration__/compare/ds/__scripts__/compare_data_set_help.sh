#!/bin/bash
set -e

echo "================Z/OS FILES LIST DATA SET HELP==============="
zowe zos-files compare ds --help
if [ $? -gt 0 ]
then
    exit $?
fi

echo "================Z/OS FILES LIST DATA SET HELP WITH RFJ==========="
zowe zos-files compare ds --help --rfj
exit $?