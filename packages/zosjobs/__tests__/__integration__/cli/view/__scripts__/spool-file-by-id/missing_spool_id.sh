#!/bin/bash
zowe zos-jobs view sfbi J123 --host fakehost --user fakeuser --pass fakepass
exit $?