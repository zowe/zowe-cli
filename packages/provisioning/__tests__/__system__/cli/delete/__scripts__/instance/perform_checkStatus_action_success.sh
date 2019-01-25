#!/bin/bash
set -e
bright provisioning perf action $1 deprovision
exit $?