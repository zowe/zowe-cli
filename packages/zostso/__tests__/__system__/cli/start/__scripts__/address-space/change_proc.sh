#!/bin/bash
set -e
bright profiles create tso changed_proc_tso -a $1 --logon-procedure $2
bright tso issue cmd "status" --tso-p "changed_proc_tso"
