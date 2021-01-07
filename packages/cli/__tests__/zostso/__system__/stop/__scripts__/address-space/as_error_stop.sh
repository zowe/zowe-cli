#!/bin/bash
set -e

zowe zos-tso stop address-space --user FakeUser --pass FakePassword --host FakeHost --port 3000
exit $?