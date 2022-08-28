+++
title = "NDS - Processor Caches"
template = "page.html"
+++

# Processor Caches

Caching is only supported on the [NDS9](/nds/nds9) processor.
The Nintendo DS supports two seperate caches (Harvard architecture),
the unified cache feature (von Neumann) is not supported.

|                 | Instruction Cache     | Data Cache              |
|-----------------|-----------------------|-------------------------|
| Capacity        | 8 KiB                 | 4 KiB                   |
| Configuration   | [4-way set associative](https://en.wikipedia.org/wiki/Cache_placement_policies#Set-associative_cache)  | [4-way set associative](https://en.wikipedia.org/wiki/Cache_placement_policies#Set-associative_cache) |
| Cache Line Size | 8 Words / 32 Bytes    | 8 Words / 32 Bytes      |
| Operations      | Read                  | Read / Write            |
