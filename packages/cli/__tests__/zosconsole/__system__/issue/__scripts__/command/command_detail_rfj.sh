#!/bin/bash
set -e

zowe zos-console issue command "D T" --include-details --response-format-json
exit $?
