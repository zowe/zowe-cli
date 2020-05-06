#!/bin/bash
set -e

zowe zos-tso stop address-space ZOSMFAD-55-aaakaaac --user FakeUser --pass FakePassword
exit $?