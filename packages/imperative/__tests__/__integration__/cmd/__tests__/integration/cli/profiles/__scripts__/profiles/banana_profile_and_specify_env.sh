#!/bin/sh

profileColor=${1:?"First parm (profileColor) is required."}
profileDescription=${2:?"Second parm (profileDescription) is required."}
profileMoldType=${3:?"Third parm (profileMoldType) is required."}

envColor=${4:?"Fourth parm (envColor) is required."}
envDescription=${5:?"Fifth parm (envDescription) is required."}
envMoldType=${6:?"Sixth parm (envMoldType) is required."}

# include zowe-cli\__tests__\__scripts__\exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/../../../../../../../../../../../__tests__/__scripts__/exitOnFailure.sh

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
