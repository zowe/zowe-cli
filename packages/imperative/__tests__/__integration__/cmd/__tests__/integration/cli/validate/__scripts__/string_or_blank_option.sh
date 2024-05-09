#!/bin/bash
echo "================ISSUING CMD WITH INVALID POSITIONAL ARGUMENT==============="
cmd-cli validate string-or-empty --string-or-empty $1
exit $?