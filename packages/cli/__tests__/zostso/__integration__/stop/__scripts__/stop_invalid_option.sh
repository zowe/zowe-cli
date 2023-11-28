#!/bin/bash
set -e

echo "================Z/OS CONSOLE INVALID OPTION==============="
zowe zos-tso stop as --foo-bar
exit $?