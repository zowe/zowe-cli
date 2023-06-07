#!/bin/bash
set -e
zowe config set profiles.changed_proc_tso.properties.account $1 --gc
zowe config set profiles.changed_proc_tso.properties.logonProcedure $2 --gc
zowe tso issue cmd "status" --tso-p "changed_proc_tso"
