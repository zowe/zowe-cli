#!/bin/bash
echo "================ISSUING HELP NO OPTIONS==============="
cmd-cli
if [ $? -gt 0 ] 
then
    exit $?
fi
echo "================ISSUING HELP WITH OPTION=============="
cmd-cli --help 
if [ $? -gt 0 ] 
then
    exit $?
fi
echo "================ISSUING HELP WITH RFJ================="
cmd-cli --help --response-format-json
if [ $? -gt 0 ] 
then
    exit $?
fi