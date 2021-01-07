set -e

HOST=$1
PORT=$2
TOKENTYPE=$3
TOKENVALUE=$4
REJECT=$5

zowe auth logout apiml --host $HOST --port $PORT --token-type $TOKENTYPE --token-value $TOKENVALUE --ru $REJECT

exit $?