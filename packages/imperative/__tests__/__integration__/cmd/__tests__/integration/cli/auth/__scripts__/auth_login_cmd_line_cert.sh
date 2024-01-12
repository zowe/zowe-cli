#!/bin/sh

echoVal=${1:?"First parm (echoVal) is required."}
baseCertFile=${2:?"Second parm (baseCertFile) is required."}
baseCertKey=${3:?"Third parm (baseCertKey) is required."}

# include zowe-cli\__tests__\__scripts__\exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/../../../../../../../../../../__tests__/__scripts__/exitOnFailure.sh

# copy our config file and certificate files
resourceDir=$myScriptDir/../__resources__
cp $resourceDir/base_cert.config.json .
exitOnFailure "Failed to copy config file." $?

cp $resourceDir/$baseCertFile .
exitOnFailure "Failed to copy certificate file." $?

cp $resourceDir/fakeKey.key .
exitOnFailure "Failed to copy certificate key file." $?

# remove existing cert from our config file
sed -e '/"certFile":/d' -e '/"certKeyFile":/d' < base_cert.config.json > imperative-test-cli.config.json
exitOnFailure "Failed to update config file." $?

echo $echoVal | imperative-test-cli auth login fruit --certFile "$baseCertFile" --certKeyFile "$baseCertKey"
exitOnFailure "Logging into auth of type fruit failed!" $?
