#!/bin/bash
set -e

zowe zos-console issue command "D T" -i
exit $?
