#!/bin/bash
set -e
bright provisioning prov template $1 --ai $2
exit $?