#!/usr/bin/env bash

command_name=$1

zowe zos-unix issue ssh "$command_name"