#!/bin/sh

HOST=${1:?"First parm (HOST) is required."}
PORT=${2:?"Second parm (PORT) is required."}
REJECT=${3:?"Third parm (REJECT) is required."}
scriptsDir=${4:?"Fourth parm (scriptsDir) is required."}

# include exitOnFailure function
. "$scriptsDir/exitOnFailure.sh"

# copy our config file template
cp "$scriptsDir/../__resources__/zowe.config_template.json" .
exitOnFailure "Failed to copy config file." $?

sed -e "s/NoBaseHostVal/$HOST/" \
    -e "s/NoBasePortVal/$PORT/" \
    -e "s/NoBaseRejectUnauthVal/$REJECT/" \
    < zowe.config_template.json > zowe.config.json
exitOnFailure "Failed to update config file." $?
