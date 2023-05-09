use std::time::{SystemTime, UNIX_EPOCH};

use rayon::prelude::*;
// use strsim::{normalized_levenshtein, levenshtein};

use crate::appstate;

fn is_only_chars(s: &str) -> bool {
    // Iterate over the indices of the string
    for i in 0..=s.len() {
        // Check if the index is a char boundary
        if !s.is_char_boundary(i) {
            // Return false if not
            return false;
        }
    }
    // Return true if all indices are char boundaries
    true
}
// Define a function that emulates the partialRatio method of FuzzySearch
// pub fn partial_ratio<F>(s1: &str, s2: &str, f: Option<&F>) -> i32
pub fn partial_ratio(s1: &str, s2: &str) -> i32
// where
//     F: Fn(&str) -> String,
{
    if(s1.len()<1
     || s2.len()<1
     ||!is_only_chars(s1)
     ||!is_only_chars(s2)
    )
    {
        return 0;
    }
    
    // Apply the closure to both strings if it is given, otherwise use the original strings
    // let s1 = match f {
    //     Some(func) => func(s1),
    //     None => s1.to_string(),
    // };
    // let s2 = match f {
    //     Some(func) => func(s2),
    //     None => s2.to_string(),
    // };

    // Find the shortest and longest strings among the two transformed strings
    let (shorter, longer) = if s1.len() <= s2.len() {
        // (s1.as_str(), s2.as_str())
        (s1, s2)
    } else {
        // (s2.as_str(), s1.as_str())
        (s2, s1)
    };

    // Initialize the best matching score to zero
    let mut best = 0 as f64;

    // Slide the shorter string along the longer string and take the simple ratio of each substring with the shorter string
    for i in 0..=longer.len() - shorter.len() {
        let substr = &longer[i..i + shorter.len()];
        // let score = normalized_levenshtein(shorter, substr) * 100.0;
        let score = levenshtein(shorter, substr) as f64;
        
        // Update the best matching score if it is higher than the current one
        if score > best {
            best = score;
        }
    }
        // best=best_match(shorter, longer) as f64;
    // Return the best matching score as an integer between 0 and 100
    best as i32
}

// use levenshtein::levenshtein;

// Define a constant for the maximum number of bits in a word
const WORD_SIZE: usize = 64;

// Define a function to calculate the bit mask for a string
fn bit_mask(s: &str) -> Vec<u64> {
    // Initialize an array of 256 words to store the bit mask for each ASCII character
    let mut mask: [u64; 256] = [0; 256];
    // Initialize a vector to store the bit mask for the string
    let mut result: Vec<u64> = Vec::new();
    // Initialize a variable to store the current word
    let mut word: u64 = 0;
    // Loop through the characters of the string
    for (i, c) in s.chars().enumerate() {
        // Get the ASCII code of the character
        let code = c as usize;
        // Check if the character has already appeared in the string
        if mask[code] == 0 {
            // If not, set the corresponding bit in the current word
            word |= 1 << (i % WORD_SIZE);
        }
        // Update the bit mask for the character
        mask[code] |= 1 << (i % WORD_SIZE);
        // Check if the current word is full
        if (i + 1) % WORD_SIZE == 0 {
            // If so, push it to the result vector and reset it
            result.push(word);
            word = 0;
        }
    }
    // Push the last word to the result vector if it is not empty
    if word != 0 {
        result.push(word);
    }
    // Return the result vector
    return result;
}
// Define a function to apply the bit-parallel algorithm to filter out candidates
fn bit_parallels(query: &str, target: &str) -> bool {
    // Get the length of the query and the target strings
    let m = query.len();
    let n = target.len();
    // Check if either string is empty
    if m == 0 || n == 0 {
        // If so, return false
        return false;
    }
    // Swap the query and target strings if the query is longer than the target
    let (query, target) = if m > n { (target, query) } else { (query, target) };
    // Recalculate the length of the query and the target strings
    // let m = query.len();
    // let n = target.len();
    // Calculate a dynamic word size based on the length of the query string
    let word_size = ((m + 63) / 64) * 64;
    // Calculate a mask that has only one bit set to 1 at position m - 1
    let match_mask = 1 << (m - 1);
    // Calculate a mask that has all bits set to 1 from position 0 to position m - 1
    let full_mask = match_mask | (match_mask - 1);
    // Calculate a mask that has all bits set to 1 except for position m - 1
    let shift_mask = full_mask ^ match_mask;
    // Calculate a mask that has all bits set to 1 except for position 0
    let carry_mask = full_mask << 1;
    // Calculate a mask that has all bits set to 1 except for position word_size - 1
    let overflow_mask = 1 << (word_size - 1);
    // Calculate a mask that has all bits set to 0 from position word_size - m + 1 to position word_size - 1
    let zero_mask = overflow_mask | (overflow_mask - (1 << (word_size - m)));
    // Calculate a mask that has all bits set to 0 except for position word_size - m
    let borrow_mask = overflow_mask >> (m - 1);
    // Calculate a mask that has all bits set to 0 from position word_size - m + 2 to position word_size - m + k + 2,
    // where k is a constant for maximum difference in words 
    let k = 2;
    let gap_mask = borrow_mask | (borrow_mask - (1 << k));
    
    // Calculate a hash map for storing the bit mask for each character in the query string
    use std::collections::HashMap;
    let mut map: HashMap<char, u64> = HashMap::new();
    // Loop through the characters of the query string and update the hash map
    for (i, c) in query.chars().enumerate() {
        // Get the current bit mask for the character or create a new one if it does not exist
        let mask = map.entry(c).or_insert(0);
        // Set the corresponding bit in the bit mask to 1
        *mask |= 1 << i;
    }

    // Initialize a variable to store the current state
    let mut state: u64 = !0;
    // Initialize a variable to store the current carry bit
    let mut carry: u64 = 0;
    
    // Loop through the characters of the target string
    for c in target.chars() {
        // Get the bit mask for the character from the hash map or use zero if it does not exist
        let mask = map.get(&c).unwrap_or(&0);
        // Update the state according to the fzf algorithm with some modifications for dynamic word size and gap tolerance
        state = ((state & shift_mask) << 1) | mask | carry;
        carry = (state & carry_mask) >> (word_size - 1);
        state &= full_mask;
        if state & overflow_mask != 0 {
            state ^= overflow_mask;
            carry ^= overflow_mask >> (word_size - m);
            state |= zero_mask;
        }
        if state & borrow_mask != 0 {
            state ^= borrow_mask;
            carry ^= borrow_mask >> k;
            state |= gap_mask;
        }
        
        // Check if there is a match
        if state & match_mask == 0 {
            // If so, return true
            return true;
        }
    }
    //No match found
    return false;
}
fn basic_fuzzy_substring(query: &str, target: &str) -> bool {
    // Get the length of the query and the target strings
    let m = query.len();
    let n = target.len();
    // Check if the query is longer than the target or empty
    if m > n || m == 0 {
        // If so, return false
        return false;
    }
    // Define a constant for the maximum number of errors allowed
    let k = 2;
    // Loop through the target string with a sliding window of size m
    for i in 0..=n - m {
        let substr = &target[i..i + m];
        // Initialize a variable to store the number of matching characters
        let mut matches = 0;
        // Loop through the characters of the query and the substring
        for (c1, c2) in query.chars().zip(substr.chars()) {
            // Check if they are equal
            if c1 == c2 {
                // If so, increment the matches
                matches += 1;
            }
        }
        // Check if the number of matches is equal to or close to m
        if matches >= m - k {
            // If so, return true
            return true;
        }
    }
    // Return false if no match is found
    return false;
}

// Define a function to find the best matching score between two strings using Levenshtein distance
fn best_match(shorter: &str, longer: &str) -> usize {
    let u:Vec<i32>=(6..8).into_par_iter().map(|e|e*e).collect();
    return 0;
    // Initialize a variable to store the best matching score
    let mut best: usize = longer.len();
    // Loop through the longer string with a sliding window of size m + k, where m is the length of shorter and k is a constant for maximum difference in words 
    let m = shorter.len();
    let k = 0;
    let a=(0..=longer.len() - (m + k)).into_par_iter().map(|i| {
        let substr = &longer[i..i + m + k];
        // Check if the substring contains all characters of shorter using bit-parallel algorithm
        // if bit_parallels(shorter, substr) {
            // If so, calculate the Levenshtein distance between shorter and substring 
            let score = levenshtein(shorter, substr);
            // println!("{}---{}----{}",shorter,substr,score);
            // Update the best matching score if it is lower than the current one (lower distance means higher similarity)
            // if score < best {
            //     best = score;
            // }
            score
        // }
        // else{
        //     println!("{}---{}",false,substr);
        // }
    }).min();
    // let percentage = 100.0 * (m as f64 - best as f64) / m as f64;
    // Return the best matching score
    // return percentage as usize;
    return a.unwrap()
}
// use aho_corasick::{AhoCorasick, PatternID};

#[test]
fn riop(){
    let now = SystemTime::now();
  let duration = now.duration_since(UNIX_EPOCH).unwrap();
  let startime = duration.as_secs();
  println!("start----{}",startime);
    for i in 0..300000{
        let y=best_match("apdst", "/home/roger/Downloads/github/notes/src-tauri/src/appstate.rs");
        // println!("{}",y)
    }
    let now = SystemTime::now();
    let duration = now.duration_since(UNIX_EPOCH).unwrap();
    let endtime = duration.as_secs();
    println!("endtime----{}",endtime-startime);
    // println!("{}",best_match("apps", "appstate.rs"))
}
// fn findifcontains(){
//     let patterns = &["apple", "maple", "Snapple"];
//     let haystack = "Nobody likes maple in their apple flavored Snapple.";
//     let ac = AhoCorasick::new(patterns).unwrap();
//     let mut matches = vec![];
//     for mat in ac.find_iter(haystack) {
//         matches.push((mat.pattern(), mat.start(), mat.end()));
//     }
// }