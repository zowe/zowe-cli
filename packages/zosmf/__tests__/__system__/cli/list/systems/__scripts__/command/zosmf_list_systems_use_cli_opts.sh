#!/bin/bash
set -e

echo "============= ZOSMF list systems with options ============"
zowe zosmf list systems $*
if [ $? -gt 0 ]
then
    exit $?
fi
