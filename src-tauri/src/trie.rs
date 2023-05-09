use std::{collections::{BinaryHeap, HashSet}, cmp::{Reverse, min}};

use rayon::prelude::*;
use rustc_hash::FxHashMap;
// use strsim::levenshtein;

use crate::partialratio::partial_ratio;
#[derive(Debug,Clone)]
pub struct indifile{
    index:usize,
    path:HashSet<String>
}
#[derive(Debug)]
// Define a struct for a trie node
pub struct TrieNode {
    // Use a HashMap to store the children nodes
    children: FxHashMap<char, TrieNode>,
    // Use an Option to store the value if any
    values: Vec<(String, usize)>,
}

// Implement some methods for the trie node
impl TrieNode {

    // Create a new empty node
    pub fn new() -> Self {
        TrieNode {
            children: FxHashMap::default(),
            values: Vec::new(),
        }
    }

    // Define a function to split a string into tokens
fn split_tokens(&self,s: String) -> Vec<String> {
    s.split(|c: char| c.is_whitespace() || c.is_ascii_punctuation())
        .filter(|t| !t.is_empty())
        .map(|y|y.to_string())
        .collect()
    
}

// Define a function to insert a token into the trie
fn insert_token(&mut self, token: &str, original: &str, index: usize) {
    let mut node = self; // start from the root node
    for c in token.to_lowercase().chars() { // iterate over the characters of the token
        node = node.children.entry(c).or_insert(TrieNode::new()); // get or create the child node with that character as the key
    }
    // if(node.values.contains(&("".to_string(),_))){

    // }
    node.values.push((original.to_string(), index)); // append the original string and its index to the vector of values
}

// Define a function to store a list of values for each node in the trie
fn store_values(&mut self) -> Vec<(String, usize)> {
    // store a list of values for this node
    let mut values = Vec::new(); // initialize an empty list of values
    for child in self.children.values_mut() { // iterate over all child nodes
        let child_values = child.values.clone(); // get a mutable reference to the child's value
        values.extend(child_values); // append its list of values to the current list
    }
    values.sort_by_key(|v| v.1);
    values // sort the current list by the index of the values
    // *self.value_mut().unwrap() = std::mem::take(&mut values); // store the current list in this node
// }
}

// Define a function to populate a trie given a vector of strings
pub fn populate_trie(&mut self,vec:Vec<String>) {

    let mut root = self; // create a new root node
    for (index, s) in vec.iter().enumerate() { // iterate over the strings and their indices in the vector
        // if(s.contains("appstate")){
        //     print!("{}",s);
        // }
        if !root.search_trie(s).is_empty(){
            println!("foundonce---{}",s);
            continue;
        }
        let tokens = root.split_tokens(s.to_string()); // split each string into tokens
        for token in tokens { // iterate over the tokens
           
            root.insert_token(&token, s, index); // insert each token into the trie
        }
    }
    println!("rootnodecount---{}",root.count_nodes());
    // root.store_values(); // store a list of values for each node in the trie
    // root // return the root node
}
// Define a function to count the nodes in a trie
pub fn count_nodes(&self) -> usize {
    // Initialize a counter
    let mut count = 0;
    // Initialize a stack for depth-first traversal
    let mut stack = vec![self];
    // Loop until the stack is empty
    while let Some(node) = stack.pop() {
        // Check if the current node has a value
        if !node.values.is_empty() {
            // Increment the counter
            count += 1;
        }
        // Push the children of the current node to the stack
        for child in node.children.values() {
            stack.push(child);
        }
    }
    // Return the counter
    count
}
// Define a function to search the trie given a string and return a vector of matching strings
pub fn search_trie(&self, query: &str) -> Vec<String> {
    let mut node = self; // start from the root node
    for c in query.chars() { // iterate over the characters of the query string
        if let Some(child) = node.children.get(&c) { // check if there is a child node with that character as the key
            node = child; // move to the child node
        } else {
            return Vec::new(); // return an empty vector if there is no match
        }
    }
    node.values.iter().map(|v| v.0.clone()).collect() // return a vector of strings that share a common prefix with the query string
}
}

// Example usage
#[test]
fn tryu() {
    // Create a new trie
    let mut trie = TrieNode::new();
    // Insert some strings
    // trie.insert("rust");
    // trie.insert("ruby");
    // trie.insert("python");
    // trie.insert("java");
    // trie.insert("javascript");
     // List all strings in the trie
    //  let strings = trie.list_all();
    //  println!("{:?}", strings); // ["rust", "ruby", "python", "java", "javascript"]
    // // Find all strings that contain "ru"
    // let matches = trie.find_all("ru");
    // println!("{:?}", matches); // ["rust", "ruby"]
}

