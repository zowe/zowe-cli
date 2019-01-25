#!/bin/bash
set -e

bright zos-tso ping address-space $1
exit $?