set -e

HOST=$1
PORT=$2
USER=$3
PASSWORD=$4
REJECT=$5

zowe config auto-init --host $HOST --port $PORT --user $USER --password $PASSWORD --ru $REJECT
if [ $? -gt 0 ]
then
    exit $?
fi

zowe config list
exit $?
