#!/bin/bash
set -e
zowe profiles create tso changed_proc_tso -a $1 --logon-procedure $2
zowe tso issue cmd "status" --tso-p "changed_proc_tso"
