#!/bin/bash
set -e

zowe zos-console issue command "DISPLAY M" --wait-to-collect 5 --follow-up-attempts 2 --response-format-json
exit $?
