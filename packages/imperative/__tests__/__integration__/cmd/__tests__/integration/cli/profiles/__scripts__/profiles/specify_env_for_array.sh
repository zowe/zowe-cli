#!/bin/sh

cliColor=$1
cliDescription=$2
cliMoldType=$3
envNames=$4

# include exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/exitOnFailure.sh

CMD_CLI_OPT_NAMES="$envNames" cmd-cli profile mapping --color "$cliColor" --banana-description "$cliDescription" --mold-type "$cliMoldType"
exitOnFailure "The 'profile mapping' command failed." $?
