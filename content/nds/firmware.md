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

### BIOS functions

These are firmware related functions from the NDS7 BIOS, that I decompiled by hand
(may be error prone):

```c
#define REG16(n) (*((volatile uint16_t*) (n)))

#define SPICNT REG16(0x40001c0)
// SPIDATA is 16bit, but only the lower 8 bit are used
#define SPIDATA REG16(0x40001c2)

#define SPICNT_ENABLE 0x8000
#define SPICNT_BUSY 0x80

// Start a spi transfer and receive one byte.
// `flags` are flags, written into `SPICNT`.
// With `hold`=1 you can enable chipselect hold.
// the function returns the first received value.
uint8 fun_227c(uint flags, uint hold) {
	// this line is strange. `hold << 11` should work the same.
	flags |= (hold * 3) << 11;
	flags |= SPICNT_ENABLE;
	flags &= 0xffff;
	while (SPICNT & SPICNT_BUSY);
	SPICNT = flags;
	// write dummy value, so transfer starts
	SPIDATA = flags;
	// wait for a transfer cycle
	while (SPICNT & 0x80);
	// read the received value
	return SPIDATA;
}

// Start a spi transmission and send the byte `val`.
// `flags` are flags, written into `SPICNT`.
// With `hold`=1 you can enable chipselect hold.
void fun_2368(uint flags, uint8 val, uint hold) {
	// this line is strange. `hold << 11` should work the same.
	flags |= (hold * 3) << 11;
	flags |= SPICNT_ENABLE;
	flags &= 0xffff;
	while (SPICNT & SPICNT_BUSY);
	SPICNT = flags;
	// write dummy value, so transfer starts
	SPIDATA = val;
}

// utility union to access the individual bytes of an integer
union r32 {
  uint u32;
  uint8 bytes;
};

// receive `count` bytes from a spi transmission into the `dst` buffer.
// If you want to continue the transmission, set `hold`=1, else `hold`=0.
void fun_22d6(uint flags, uint *dst, int count, uint hold) {
  // wft, no idea what this is for. Is it a bug? Or is it a feature™?
  if (count < 0)
    count -= 0x40000000;
  // align to 32-bit
  count &= ~3;
  while (SPICNT & SPICNT_BUSY);
  uint *end = (uint*) ((uint8*) dst + count);
  for (r32 val; dst < end; ++dst) {
    val.u32 = 0;
    for (uint idx = 0, hold_now = 1; idx < 4; ++idx) {
      // if we transmit the last byte, clear chipselect hold (if specified)
      if (dst >= end - 1 && idx == 3)
        hold_now = hold;
      // receive a byte
      val.bytes[idx] = func_227c(flags, hold_now);
    }
    *dst = val.u32;
  }
}
```
