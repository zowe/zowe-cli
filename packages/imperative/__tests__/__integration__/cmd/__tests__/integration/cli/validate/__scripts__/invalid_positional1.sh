#!/bin/bash
echo "================ISSUING CMD WITH INVALID POSITIONAL ARGUMENT==============="
cmd-cli validate syntax position-1
exit $?