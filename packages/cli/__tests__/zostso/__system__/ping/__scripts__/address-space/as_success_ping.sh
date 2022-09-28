#!/bin/bash
set -e

zowe zos-tso ping address-space $1
exit $?