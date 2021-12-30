#!/bin/bash
set -e

echo "================ daemon enable help ==============="
zowe daemon disable --help
if [ $? -gt 0 ]
then
    exit $?
fi
