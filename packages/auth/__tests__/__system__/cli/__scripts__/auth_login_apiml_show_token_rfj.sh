set -e

HOST=$1
PORT=$2
USER=$3
PASSWORD=$4
REJECT=$5
SHOWTOKEN=$6

zowe auth login apiml --host $HOST --port $PORT --user $USER --password $PASSWORD --ru $REJECT --st $SHOWTOKEN --rfj

exit $?