#!/bin/bash
set -e

# our first parm is the execuable to run.
# All remaining parms are passed to that executable
echo "Zowe EXE test command = $*"
$*
if [ $? -gt 0 ]
then
    exit $?
fi
