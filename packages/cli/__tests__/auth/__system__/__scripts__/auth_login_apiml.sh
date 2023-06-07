#!/bin/bash
set -e

echo "y" | zowe auth login apiml --user $1 --password $2

exit $?