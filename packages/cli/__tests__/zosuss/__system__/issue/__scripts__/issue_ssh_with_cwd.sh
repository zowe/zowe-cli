#!/bin/bash

command_name=$1
cwd=$2

zowe uss issue ssh "$command_name" --cwd "$cwd"