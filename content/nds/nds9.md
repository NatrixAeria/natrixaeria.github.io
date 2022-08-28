+++
title = "NDS - NDS9"
template = "page.html"
+++

# NDS9 processor

The NDS9 processor is a ARM946E-S 32-bit RISC cpu running at 67.028 MHz.

Notable properties are:

* Uses the ARMv5TE specification
* Clocked at twice the speed of the [NDS7](/nds/nds7)
* 5-stage pipeline
* Contains a [CP-15](/nds/cp15) coprocessor for memory management
* Contains **NO** CP-14/ICEbreaker coprocessor
* Contains [TCM](/nds/tcm) (**D**ata **TCM** and **I**nstruction **TCM**)
* Supports [caching](/nds/cache)
* Supports big/little endianness (BIOS defaults to little endian, no emulator supports big endian)
