#!/bin/bash
set -e

echo "================ daemon enable ==============="
zowe daemon disable
if [ $? -gt 0 ]
then
    exit $?
fi
