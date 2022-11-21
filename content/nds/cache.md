+++
title = "NDS - Processor Caches"
template = "page.html"
+++

# Processor Caches

Caching is only supported on the [NDS9](/nds/nds9) processor.
The Nintendo DS supports two seperate caches (Harvard architecture),
the unified cache feature (von Neumann) is not supported. However, they
can be enabled and disabled each.

|                 | Instruction Cache     | Data Cache              |
|-----------------|-----------------------|-------------------------|
| Capacity        | 8 KiB                 | 4 KiB                   |
| Configuration   | [4-way set associative](https://en.wikipedia.org/wiki/Cache_placement_policies#Set-associative_cache)  | [4-way set associative](https://en.wikipedia.org/wiki/Cache_placement_policies#Set-associative_cache) |
| Cache Line Size | 8 Words / 32 Bytes    | 8 Words / 32 Bytes      |
| Operations      | Read                  | Read / Write            |

Here are some variables defined by the [ARM Architecture Reference Manual](/nds/links)

|                       | Instruction Cache     | Data Cache              |
|-----------------------|-----------------------|-------------------------|
| LINELEN               | 32                    | 32                      |
| NSETS                 | 64                    | 32                      |
| ASSOCIATIVITY = NWAYS | 4                     | 4                       |

{{ markdownimg(src='/images/nds-cache.svg', title='Data cache organisation', invert=true, nr=1) }}

## Lockdown functionality

Both the instruction cache and the data cache support the lockdown functionality.
It can be controlled by the following [CP-15](/nds/cp15) registers

`Cn=9,Cm=0,Op2=0, Data Cache Lockdown Register`,
`Cn=9,Cm=0,Op2=1, Instruction Cache Lockdown Register`

```
╭ 3 ╷         2         ╷         1         ╷         0         ╮
┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│1│0│9│8│7│6│5│4│3│2│1│0│9│8│7│6│5│4│3│2│1│0│9│8│7│6│5│4│3│2│1│0│
╞═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╪═╧═╡
│L│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│-│WAY│
└─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴───┘
```

