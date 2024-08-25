+++
title = "NDS - Firmware"
template = "page.html"
+++

# Firmware

The Nintendo DS firmware is a 256KiB (512KiB for [iQue](https://en.wikipedia.org/wiki/IQue))
[flash](https://en.wikipedia.org/wiki/Flash_memory#Serial_flash) memory, that
is not memory mapped. You can access it via
[SPI-bus](https://en.wikipedia.org/wiki/Serial_Peripheral_Interface).

## Memory Access

Memory access is only possible via [NDS7](/nds/nds7) with the `SPICNT 0x40001c0`
and the `SPIDATA 0x40001c2` registers.
DMA probably isn't really feasable for reading or writing, because DMA
has no 8-bit mode (only 16 or 32) and SPI has no functional 16-bit mode.
