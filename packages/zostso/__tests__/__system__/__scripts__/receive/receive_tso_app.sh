#!/bin/bash
account=$1
host=$2
port=$3
user=$4
password=$5
ru=$6
servletKey=$7
appKey=$8
rur=$9

zowe zos-tso r app --app-key $appKey --servlet-key "$servletKey" --rur $rur --account $account --host $host --port $port --user $user --password $password --ru $ru
exit $?
