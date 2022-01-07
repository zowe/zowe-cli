#!/bin/bash
set -e

echo "================ daemon enable ==============="
zowe daemon disable
exit $?
