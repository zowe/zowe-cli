#!/bin/bash
set -e

echo "================ daemon enable ==============="
zowe daemon enable
exit $?
