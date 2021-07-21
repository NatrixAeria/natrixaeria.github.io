# This is the repository for **NatrixHub**

See [NatrixHub](natrixaeria.github.io) for current hosting.

## Building sources

Run the `make-pages.rs` script in the project root.
There are two ways to run the script:

- `rustc make-pages.rs -o /tmp/make-pages && /tmp/make-pages`
- Create the `rustx` executable into a path in `$PATH`
  with the following content

  ```rust
  #!/bin/sh

  if rustc $1 -C opt-level=1 -C debuginfo=2 -o /tmp/rustx-result; then
      /tmp/rustx-result
      rm /tmp/rustx-result
  fi
  ```

  then you should be able to run `make-pages.rs` with `./make-pages.rs`
