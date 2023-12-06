#!/bin/bash

envColor=$1
envDescription=$2
envMoldType=$3

# include exitOnFailure function
myScriptDir=`dirname $0`
source $myScriptDir/exitOnFailure.sh

CMD_CLI_OPT_COLOR="$envColor" CMD_CLI_OPT_BANANA_DESCRIPTION="$envDescription" CMD_CLI_OPT_MOLD_TYPE="$envMoldType" \
    cmd-cli profile mapping-positional
exitOnFailure "The 'profile mapping-positional' command failed." $?
