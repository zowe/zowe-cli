#!/bin/bash
set -e

echo "================ daemon restart ==============="
zowe daemon restart
exit $?
