#!/bin/sh

baseAmount=${1:?"First parm (baseAmount) is required."}
basePrice=${2:?"Second parm (basePrice) is required."}
kiwiAmount=${3:?"Third parm (kiwiAmount) is required."}

# include zowe-cli\__tests__\__scripts__\exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/../../../../../../../../../../../__tests__/__scripts__/exitOnFailure.sh

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
