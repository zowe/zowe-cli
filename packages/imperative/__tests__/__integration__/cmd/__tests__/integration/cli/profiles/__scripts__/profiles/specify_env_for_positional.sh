#!/bin/sh

envColor=${1:?"First parm (envColor) is required."}
envDescription=${2:?"Second parm (envDescription) is required."}
envMoldType=${3:?"Third parm (envMoldType) is required."}

# include zowe-cli\__tests__\__scripts__\exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/../../../../../../../../../../../__tests__/__scripts__/exitOnFailure.sh

CMD_CLI_OPT_COLOR="$envColor" CMD_CLI_OPT_BANANA_DESCRIPTION="$envDescription" CMD_CLI_OPT_MOLD_TYPE="$envMoldType" \
    cmd-cli profile mapping-positional
exitOnFailure "The 'profile mapping-positional' command failed." $?
