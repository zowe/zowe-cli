#!/bin/sh

profileColor=$1
profileDescription=$2
profileMoldType=$3
cliName=$4
cliType=$5

# include exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/exitOnFailure.sh

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
