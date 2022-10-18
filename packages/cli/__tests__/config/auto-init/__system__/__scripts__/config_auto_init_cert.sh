set -e

HOST=$1
PORT=$2
CERTFILE=$3
CERTKEYFILE=$4
REJECT=$5

zowe config auto-init --host $HOST --port $PORT --certFile $CERTFILE --certKeyFile $CERTKEYFILE --ru $REJECT
if [ $? -gt 0 ]
then
    exit $?
fi

zowe config list
exit $?
