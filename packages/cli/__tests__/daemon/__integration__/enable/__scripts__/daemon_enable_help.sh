#!/bin/bash
set -e

echo "================ TODO: Remove this ==============="
echo PATH = $PATH
echo "================ daemon enable help ==============="
zowe daemon enable --help
if [ $? -gt 0 ]
then
    exit $?
fi
