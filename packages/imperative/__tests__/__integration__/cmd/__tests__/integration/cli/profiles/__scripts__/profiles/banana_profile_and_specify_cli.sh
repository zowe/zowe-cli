#!/bin/sh

profileColor=$1
profileDescription=$2
profileMoldType=$3

cliColor=$4
cliDescription=$5
cliMoldType=$6

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

# show the property values that will be used
cmd-cli profile mapping --color "$cliColor" --banana-description "$cliDescription" --mold-type "$cliMoldType"
exitOnFailure "The 'profile mapping' command failed." $?
