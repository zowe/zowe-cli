#!/bin/sh

# include exitOnFailure function
myScriptDir=`dirname $0`
. $myScriptDir/exitOnFailure.sh

# copy our config file
cp $myScriptDir/../__resources__/base_password.config.json imperative-test-cli.config.json
exitOnFailure "Failed to copy config file." $?

# login to fruit auth
echo Y | imperative-test-cli auth li fruit
exitOnFailure "Logging into auth of type fruit failed!" $?

# show contents of our config file
imperative-test-cli config list profiles
exitOnFailure "Display of updated imperative-test-cli.config.json failed!" $?
