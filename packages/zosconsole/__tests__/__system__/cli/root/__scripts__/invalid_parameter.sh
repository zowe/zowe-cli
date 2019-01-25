#!/bin/bash
set -e

echo "================Z/OS CONSOLE INVALID PARAMETERS==============="
bright zos-console foobar
exit $?
