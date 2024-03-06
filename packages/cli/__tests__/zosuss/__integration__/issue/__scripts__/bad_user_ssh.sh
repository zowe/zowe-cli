#!/bin/bash
set -e

zowe zos-uss issue ssh "echo test"
exit $?