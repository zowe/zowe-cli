#!/bin/bash
set -e

echo "============= Todo: remove this =============="
which zowe
echo PATH = $PATH
echo "================ daemon enable ==============="
zowe daemon enable
exit $?
