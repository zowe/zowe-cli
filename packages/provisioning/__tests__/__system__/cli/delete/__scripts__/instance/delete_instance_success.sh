#!/bin/bash
set -e
zowe provisioning delete instance $1
exit $?