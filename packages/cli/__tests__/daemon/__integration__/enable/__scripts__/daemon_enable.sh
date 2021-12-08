#!/bin/bash
set -e

echo "================ daemon enable ==============="
zowe daemon enable
if [ $? -gt 0 ]
then
    exit $?
fi
