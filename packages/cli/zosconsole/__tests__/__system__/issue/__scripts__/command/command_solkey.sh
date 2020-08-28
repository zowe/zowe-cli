#!/bin/bash
set -e

zowe zos-console issue command "D IPLINFO" --sk "SYSTEM"
exit $?
