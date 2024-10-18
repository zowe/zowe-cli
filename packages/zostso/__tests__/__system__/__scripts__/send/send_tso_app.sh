#!/bin/bash
account=$1
host=$2
port=$3
user=$4
password=$5
ru=$6
servletKey=$7
message=$8
appKey=$9

echo "Account: $account"
echo "Host: $host"
echo "Port: $port"
echo "User: $user"
echo "Password: $password"
echo "RU: $ru"
echo "ServletKey: $servletKey"
echo "Message: $message"

zowe zos-tso send app --ak "$appKey" --sk "$servletKey" --message "$message" --account $account --host $host --port $port --user $user --password $password --ru $ru
exit $?
