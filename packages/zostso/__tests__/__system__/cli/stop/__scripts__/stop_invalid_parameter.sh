#!/bin/bash
set -e

echo "================Z/OS CONSOLE INVALID PARAMETERS==============="
bright zos-tso stop foobar
exit $?