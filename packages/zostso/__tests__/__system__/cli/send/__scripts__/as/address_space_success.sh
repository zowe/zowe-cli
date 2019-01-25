#!/bin/bash
set -e

# Start address space, if the command was successful, a servlet key will be received

bright zos-tso send address-space $1 --data "time"

exit $?
