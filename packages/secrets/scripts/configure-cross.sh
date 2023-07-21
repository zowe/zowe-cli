#!/bin/bash

# Set environment variables needed for cross-compilation in current shell
set_env() {
    export PKG_CONFIG_SYSROOT_DIR="${CHROOT:-/}"
    export RUSTFLAGS="-L $CHROOT$1 $RUSTFLAGS"
    export PKG_CONFIG_PATH="$CHROOT$1/pkgconfig"
}

case "$1" in
    "aarch64-unknown-linux-gnu")
        set_env "/usr/lib/aarch64-linux-gnu"
        ;;
    "aarch64-unknown-linux-musl")
        CHROOT="/aarch64-linux-musl-cross"
        RUSTFLAGS="-C linker=$CHROOT/bin/aarch64-linux-musl-gcc"
        set_env "/usr/lib"
        ;;
    "armv7-unknown-linux-gnueabihf")
        set_env "/usr/lib/arm-linux-gnueabihf"
        ;;
    "i686-unknown-linux-gnu")
        set_env "/usr/lib/i386-linux-gnu"
        ;;
    "x86_64-unknown-linux-gnu")
        set_env "/usr/lib/x86_64-linux-gnu"
        ;;
    *)
        ;;
esac
