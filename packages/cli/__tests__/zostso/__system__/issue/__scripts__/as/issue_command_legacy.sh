#!/bin/bash
set -e

zowe zos-tso issue command "time" --legacy

exit $?