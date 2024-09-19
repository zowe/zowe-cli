#!/bin/bash
set -e

echo "================Z/OS CONSOLE INVALID OPTION==============="
zowe zos-tso start --foo-bar
exit $?