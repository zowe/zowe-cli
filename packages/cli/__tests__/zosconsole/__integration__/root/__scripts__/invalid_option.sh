#!/bin/bash
set -e

echo "================Z/OS CONSOLE INVALID OPTION==============="
zowe zos-console --foo-bar
exit $?
