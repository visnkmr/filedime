// Define constants for kilobyte, megabyte, gigabyte and terabyte
const KB: u64 = 1024;
const MB: u64 = KB.pow(2);
const GB: u64 = KB.pow(3);
const TB: u64 = KB.pow(4);

// Define a function that takes a number of bytes and a boolean flag for bits
// and returns a formatted string with the appropriate unit
pub fn size(B: u64, isbytes: bool) -> String {
    // If isbytes is false, multiply B by 8 to get bits
    let B = if isbytes { B } else { B * 8 };
    // Set the unit suffix based on isbytes
    let u = if isbytes { "B" } else { "b" };
    // Check the range of B and return the corresponding string
    if B < KB {
        format!("{}{}", B, u)
    } else if KB <= B && B < MB {
        format!("{} K{}", B / KB, u)
    } else if MB <= B && B < GB {
        format!("{} M{}", B / MB, u)
    } else if GB <= B && B < TB {
        format!("{} G{}", B / GB, u)
    } else if TB <= B {
        format!("{} T{}", B / TB, u)
    } else {
        "".to_string()
    }
}