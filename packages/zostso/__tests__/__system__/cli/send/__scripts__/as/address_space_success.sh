#!/bin/bash
set -e

# Start address space, if the command was successful, a servlet key will be received

zowe zos-tso send address-space $1 --data "time"

exit $?
