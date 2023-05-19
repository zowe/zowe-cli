#!/bin/bash

command_name=$1

zowe uss issue ssh "$command_name" ${@:2}
