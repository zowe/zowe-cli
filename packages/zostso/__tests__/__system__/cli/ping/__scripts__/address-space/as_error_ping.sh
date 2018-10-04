#!/bin/bash
set -e

zowe zos-tso ping address-space BadKey
exit $?