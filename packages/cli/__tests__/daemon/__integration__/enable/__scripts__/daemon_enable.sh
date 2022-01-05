#!/bin/bash
set -e

echo "================ TODO: Remove this ==============="
echo PATH = $PATH
echo "================ daemon enable ==============="
zowe daemon enable
if [ $? -gt 0 ]
then
    exit $?
fi
