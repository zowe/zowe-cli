#!/bin/sh

profileColor=${1:?"First parm (profileColor) is required."}
profileDescription=${2:?"Second parm (profileDescription) is required."}
profileMoldType=${3:?"Third parm (profileMoldType) is required."}
cliName=${4:?"Fourth parm (cliName) is required."}
cliType=${5:?"Fifth parm (cliType) is required."}

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

# should print the name and type that are specified, not the profile name or type
cmd-cli profile mapping-name-type "$cliName" --type "$cliType"
exitOnFailure "The 'profile mapping-name-type' command failed." $?
