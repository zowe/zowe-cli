#!/bin/bash
set -e
zowe provisioning prov template $1 --ai $2
exit $?