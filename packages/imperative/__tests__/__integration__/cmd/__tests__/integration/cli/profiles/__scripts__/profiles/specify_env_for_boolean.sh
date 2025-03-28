#!/bin/sh

cliColor=${1:?"First parm (cliColor) is required."}
cliDescription=${2:?"Second parm (cliDescription) is required."}
cliMoldType=${3:?"Third parm (cliMoldType) is required."}
envRipe=${4:?"Fourth parm (envRipe) is required."}

# include zowe-cli\__tests__\__scripts__\exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/../../../../../../../../../../../__tests__/__scripts__/exitOnFailure.sh

CMD_CLI_OPT_RIPE=$envRipe cmd-cli profile mapping --color "$cliColor" --banana-description "$cliDescription" --mold-type "$cliMoldType"
exitOnFailure "The 'profile mapping' command failed." $?
