#!/bin/bash
set -e

zowe zos-console issue command "D T" --key-only --response-format-json
exit $?
