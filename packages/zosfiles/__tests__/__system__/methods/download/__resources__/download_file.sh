#!/bin/bash
account=$1
host=$2
port=$3
user=$4
password=$5
ru=$6
fileToDownload=$7
attributes=$8

zowe zos-files download uss "$fileToDownload" --attributes "$attributes" --host $host --port $port --user $user --password $password --ru $ru
exit $?