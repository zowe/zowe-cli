#!/bin/sh

echoVal=${1:?"First parm (echoVal) is required."}
baseUser=${2:?"Second parm (baseUser) is required."}
basePass=${3:?"Third parm (basePass) is required."}

# include zowe-cli\__tests__\__scripts__\exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/../../../../../../../../../../__tests__/__scripts__/exitOnFailure.sh

# copy our config file
cp $myScriptDir/../__resources__/base_password.config.json .
exitOnFailure "Failed to copy config file." $?

# remove existing user and password from our config file
sed -e '/"user":/d' -e '/"password":/d' < base_password.config.json > imperative-test-cli.config.json
exitOnFailure "Failed to update config file." $?

echo $echoVal | imperative-test-cli auth login fruit --user "$baseUser" --password "$basePass"
exitOnFailure "Logging into auth of type fruit failed!" $?
