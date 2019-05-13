#!/bin/bash
set -e
zowe provisioning prov template $1
exit $?