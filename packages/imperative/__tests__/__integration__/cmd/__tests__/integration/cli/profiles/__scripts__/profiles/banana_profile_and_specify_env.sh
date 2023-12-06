#!/bin/bash

profileColor=$1
profileDescription=$2
profileMoldType=$3

envColor=$4
envDescription=$5
envMoldType=$6

# include exitOnFailure function
myScriptDir=`dirname $0`
source $myScriptDir/exitOnFailure.sh

# set desired properties in our config file
cp $myScriptDir/banana.config.json .
exitOnFailure "Failed to copy config file." $?

sed -e "s/NoColorVal/$profileColor/" \
    -e "s/NoDescriptionVal/$profileDescription/" \
    -e "s/NoMoldTypeVal/$profileMoldType/" \
    < banana.config.json > cmd-cli.config.json
exitOnFailure "Failed to update config file." $?

# show the property values that will be used
CMD_CLI_OPT_COLOR="$envColor" CMD_CLI_OPT_BANANA_DESCRIPTION="$envDescription" CMD_CLI_OPT_MOLD_TYPE="$envMoldType" cmd-cli profile mapping
exitOnFailure "The 'profile mapping' command failed." $?
