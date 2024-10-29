#!/bin/bash
account=$1
host=$2
port=$3
user=$4
password=$5
ru=$6
inputFile=$7
ussName=$8
attributes=$9

zowe zos-files upload file-to-uss $inputFile $ussName --attributes $attributes --host $host --port $port --user $user --password $password --ru $ru
exit $?