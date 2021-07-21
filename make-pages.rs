#!/usr/bin/env rustx

use std::path::Path;

struct Context {
    dir: std::collections::HashMap<String, String>,
}

impl Context {
    fn new() -> Self {
        Self {
            dir: Default::default(),
        }
    }

    fn get(&self, name: &str) -> &str {
        self.dir.get(name).map(String::as_str).unwrap_or("")
    }

    fn set(&mut self, name: String, value: String) {
        drop(self.dir.insert(name, value))
    }
}

fn process_file<P1: AsRef<Path>, P2: AsRef<Path>>(ctx: &mut Context, src: P1, dst: P2) {
    println!(
        "processing '{}' -> '{}'",
        src.as_ref().display(),
        dst.as_ref().display()
    );
    std::fs::write(
        dst,
        process_file_helper(ctx, &mut std::fs::read_to_string(src).unwrap().chars()),
    )
    .unwrap();
}

fn process_file_helper(ctx: &mut Context, chars: &mut std::str::Chars) -> String {
    let mut result = String::new();
    loop {
        let text = chars.as_str();
        let is_escape = text.starts_with("{%%");
        if text.starts_with("{%") && !is_escape {
            chars.next().unwrap();
            chars.next().unwrap();
            let text = chars.as_str();
            if let Some(text_end) = text.find('}') {
                let (cmd, args) = text[..text_end]
                    .trim()
                    .split_once(char::is_whitespace)
                    .unwrap_or_else(|| (text[..text_end].trim(), ""));
                let (mut cmd, args) = (cmd.to_string(), args.to_string());
                for _ in 0..text[..text_end].chars().count() + 1 {
                    drop(chars.next())
                }
                cmd.make_ascii_lowercase();
                match cmd.as_str() {
                    "include" => {
                        let mut text = process_file_helper(
                            ctx,
                            &mut std::fs::read_to_string(args.trim()).unwrap().chars(),
                        );
                        if text.ends_with('\n') {
                            text.pop().unwrap();
                        }
                        result += text.as_str();
                    }
                    "get" => result += ctx.get(args.trim()),
                    "set" => {
                        let (name, value) = args.split_once(char::is_whitespace).unwrap();
                        ctx.set(name.to_string(), value.to_string())
                    }
                    "blockset" => {
                        let content = process_file_helper(ctx, chars);
                        ctx.set(args.trim().to_string(), content);
                    }
                    "end" => {
                        return result;
                    }
                    _ => panic!("unknown command"),
                }
            }
        } else if is_escape {
            result += "{%";
            chars.next().unwrap();
            chars.next().unwrap();
            chars.next().unwrap();
        } else if let Some(c) = chars.next() {
            result.push(c)
        } else {
            break;
        }
    }
    result
}

fn process_dir<P1: AsRef<Path>, P2: AsRef<Path>>(ctx: &mut Context, src: P1, dst: P2) {
    for entry in std::fs::read_dir(src).unwrap().flatten() {
        if entry.file_type().ok().filter(|t| t.is_dir()).is_some() {
            let name = entry.path();
            let mut new_dst = dst.as_ref().to_owned();
            new_dst.push(name.file_name().unwrap());
            process_dir(ctx, name, new_dst);
        } else if entry.file_type().ok().filter(|t| t.is_file()).is_some() {
            let mut dst_file = dst.as_ref().to_owned();
            dst_file.push(entry.path().file_name().unwrap());
            process_file(ctx, entry.path(), dst_file);
        }
    }
}

fn main() {
    process_dir(&mut Context::new(), "res/", "docs/")
}
