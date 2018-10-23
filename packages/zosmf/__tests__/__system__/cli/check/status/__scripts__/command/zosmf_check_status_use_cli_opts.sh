#!/bin/bash
set -e

echo "============= ZOSMF check status with options ============"
zowe zosmf check status $*
if [ $? -gt 0 ]
then
    exit $?
fi
