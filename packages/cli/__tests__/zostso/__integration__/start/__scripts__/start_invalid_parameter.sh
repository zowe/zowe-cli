#!/bin/bash
set -e

echo "================Z/OS CONSOLE INVALID PARAMETERS==============="
zowe zos-tso start foobar
exit $?