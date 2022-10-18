#!/bin/bash
set -e

echo "================ daemon disable ==============="
zowe daemon disable
exit $?
