#!/bin/bash
set -e

echo "================Z/OS CONSOLE INVALID PARAMETERS==============="
bright zos-tso start foobar
exit $?