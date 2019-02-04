#!/usr/bin/env bash

command_name=$1
cwd=$2

zowe zos-unix issue command "$command_name" --cwd "$cwd"