#!/bin/bash
set -e

echo "================ TODO: Remove this ==============="
where zowe
echo PATH = $PATH
echo "================ daemon enable help ==============="
zowe daemon enable --help
echo "====== After zowe command TODO: Remove this ======="
exit $?

