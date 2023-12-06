#!/bin/bash

baseAmount=$1
basePrice=$2
kiwiAmount=$3

# include exitOnFailure function
myScriptDir=`dirname $0`
source $myScriptDir/exitOnFailure.sh

# set desired properties in our config file
cp $myScriptDir/base_and_kiwi.config.json .
exitOnFailure "Failed to copy config file." $?

sed -e "s/NoBaseAmountVal/$baseAmount/" \
    -e "s/NoBasePriceVal/$basePrice/" \
    -e "s/NoKiwiAmountVal/$kiwiAmount/" \
    < base_and_kiwi.config.json > cmd-cli.config.json
exitOnFailure "Failed to update config file." $?

# show the property values that will be used
cmd-cli profile mapping-base
exitOnFailure "The 'profile mapping' command failed." $?
