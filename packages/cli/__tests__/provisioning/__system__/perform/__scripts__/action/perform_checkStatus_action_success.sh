#!/bin/bash
set -e
zowe provisioning perf action $1 checkStatus
exit $?