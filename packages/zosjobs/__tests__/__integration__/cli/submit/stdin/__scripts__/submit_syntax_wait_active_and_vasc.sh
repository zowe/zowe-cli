#!/bin/bash
zowe zos-jobs submit stdin --wait-for-active --vasc
exit $?
