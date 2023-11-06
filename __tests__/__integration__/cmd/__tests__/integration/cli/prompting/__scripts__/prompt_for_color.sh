#!/bin/bash
set -e

 # should print the name and type that are specified, not the profile name or type
echo "$1" | cmd-cli profile mapping --mold-type "moldy" --banana-description "big_banana" --color "PROMPT*"
