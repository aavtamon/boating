#!/bin/sh

go install piztec.com/boat/tools/pwdgen && ${GOPATH}/bin/pwdgen $1 $2