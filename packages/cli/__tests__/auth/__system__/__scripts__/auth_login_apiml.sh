#!/bin/bash
set -e

echo "y" | zowe auth login apiml

exit $?