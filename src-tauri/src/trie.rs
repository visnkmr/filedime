use std::{collections::{BinaryHeap, HashSet}, cmp::{Reverse, min}};

use rayon::prelude::*;
use rustc_hash::FxHashMap;
use strsim::levenshtein;

use crate::partialratio::partial_ratio;
#[derive(Debug,Clone)]
pub struct indifile{
    name:String,
    path:HashSet<String>
}
#[derive(Debug)]
// Define a struct for a trie node
pub struct TrieNode {
    // Use a HashMap to store the children nodes
    children: FxHashMap<char, TrieNode>,
    // Use an Option to store the value if any
    value: Option<indifile>,
}

// Implement some methods for the trie node
impl TrieNode {
    // Create a new empty node
    pub fn new() -> Self {
        TrieNode {
            children: FxHashMap::default(),
            value: None,
        }
    }

    // Insert a string into the trie
    pub fn insert(&mut self, s: &str,path:&str) {
        // println!("inserting....{s}");
        // Start from the root node
        let mut node = self;
        

        // Iterate over the characters of the string
        for c in s.to_lowercase().chars() {
            // Get the child node for the current character
            // If it does not exist, create a new one and insert it into the HashMap
            node = node.children.entry(c).or_insert_with(TrieNode::new);
        }
        
        if let Some(u) = node.value.clone() {
            if(u.path.contains(path)){
                return ;
            }
        }
        let mut lov=HashSet::new();
        // Set the value of the last node to the string
        if let Some(u) = node.value.clone() {
            lov=u.path;
        }
        lov.insert(path.to_string());
        node.value = Some(indifile{
            name:s.to_string(),
            path:lov
        });
    }

    // // Search for a string in the trie
    // fn search(&self, s: &str) -> bool {
    //     // Start from the root node
    //     let mut node = self;
    //     // Iterate over the characters of the string
    //     for c in s.chars() {
    //         // Get the child node for the current character
    //         // If it does not exist, return false
    //         match node.children.get(&c) {
    //             Some(child) => node = child,
    //             None => return false,
    //         }
    //     }
    //     // Return true if the last node has a value
    //     node.value.is_some()    
    // }
    // Search for a string in the trie and return a list of values that begin with it
    pub fn search(&self, s: &str,path:String) -> HashSet<String> {
        let sl=s.to_lowercase();
        println!("{}---{}",sl,s.to_lowercase());
        // Start from the root node
        let mut node = self;
        // Iterate over the characters of the string
        // for c in path.chars() {
        //     // Get the child node for the current character
        //     // If it does not exist, return an empty list
        //     match node.children.get(&c) {
        //         Some(child) => node = child,
        //         None => return Vec::new(),
        //     }
        // }
        for c in s.to_lowercase().chars() {
            // Get the child node for the current character
            // If it does not exist, return an empty list
            match node.children.get(&c) {
                Some(child) => node = child,
                None => return HashSet::new(),
            }
        }
        // Call a helper function to recursively collect all values from this node and its descendants
        let mut results = HashSet::new();
        node.collect_values(&mut results);
        println!("res-----------{}",results.len());
        return results;
        // let sorted: Vec<String> = results
        // // Map each string to a pair of (string, number)
        // .par_iter()
        // .map(|es| (es.clone(), partial_ratio(es,s)))
        // // Sort the pairs by the number in ascending order
        // .par_sort_by_key(|pair| pair.1)
        // // Map the pairs back to strings
        // .map(|pair| pair.0)
        // // Collect the strings into a vector
        // .collect();

        // Convert the vector into a mutable slice
    //     let mut slice = results.as_mut_slice();
    //     // Sort the slice by the calculated keys in ascending order
    //     slice.par_sort_by_cached_key(|es| Reverse(partial_ratio(es,s)));
    //     // Return the sorted vector
    //     // return slice.to_vec();
    //     let mut slice=slice.to_vec();
    //     println!("slice---------{}",slice.len());
    //     let mut cn=slice.len().checked_sub(5).unwrap_or(0);
    //     cn=if(cn>0){
    //         cn
    //     }
    //     else{
    //         slice.len()
    //     };
    //     let result = if(cn>0) {
    //         slice.split_off(cn)
    //     }
    //     else{
    //         slice
    //     };
    // // Return the result vector
    // result
        // let strings: Vec<String> = results
        // .into_par_iter()
        // .filter(
        //         |search|
        //         // search.contains(s)
        //         partial_ratio(search, s)>20
        //     ).
        //     map(
        //         |path|
        //         path
        //     ).
        //     collect();
        // let mut vs:FxHashMap<String,i32>=FxHashMap::default();
        // for i in results.clone(){
        //     vs.insert(i.clone(), partial_ratio(&i, s));
        // }
        // Return the results list

        // results
        // self.shtv(vs)
        // strings
    }
// Define a function that sorts a hashmap by i32 and returns as a vector of strings
fn shtv(&self,
    hashmap: FxHashMap<String, i32>,
) -> Vec<String> {
    // Convert the hashmap into a vector of pairs
    let mut pairs: Vec<(String, i32)> = hashmap.into_iter().collect();
    // Sort the vector by the i32 values in descending order
    pairs.sort_by_key(|pair| -pair.1);
    // Map the vector of pairs into a vector of strings
    let strings: Vec<String> = pairs.into_iter().
    filter(
        |pair|
        pair.1>20
    ).
    map(
        |pair|
        pair.0
    ).
    collect();
    // Return the vector of strings
    strings
}
 // Fuzzy search for a string in the trie and return a list of values that are similar to it
 pub fn fuzzy_search(&self, s: &str, threshold: usize, k: usize) -> Vec<String> {
    // Create an empty priority queue to store the results
    let mut queue = BinaryHeap::new();
    // Call a helper function to recursively traverse the trie and compare values with s
    self.fuzzy_search_helper(s, threshold, &mut queue);
    // Create an empty vector to store the results
    let mut results = Vec::new();
    // Pop k elements from the queue and push them to the vector
    for _ in 0..k {
        if let Some((Reverse(distance), value)) = queue.pop() {
            results.push(value);
        } else {
            break;
        }
    }
    // Return the results vector
    results
}

// Helper function to recursively traverse the trie and compare values with s
fn fuzzy_search_helper(&self, s: &str, threshold: usize, queue: &mut BinaryHeap<(Reverse<usize>, String)>) {
    // If this node has a value, calculate its Levenshtein distance with s
    if let Some(value) = &self.value {
        let distance = levenshtein(s, &value.name);
        // If the distance is within the threshold, push it to the queue
        if distance <= threshold {
            queue.push((Reverse(distance), value.name.clone()));
        }
    }
    // Iterate over the children nodes and call this function on them
    for child in self.children.values() {
        child.fuzzy_search_helper(s, threshold, queue);
    }
}
    // Helper function to recursively collect all values from this node and its descendants
    fn collect_values(&self, results: &mut HashSet<String>) {
        // If this node has a value, push it to the results list
        if let Some(value) = &self.value {
            for e in value.path.clone(){
                results.insert(e);
            }
        }
        // Iterate over the children nodes and call this function on them
        for child in self.children.values() {
            child.collect_values(results);
        }
    }
    // Find all strings in the trie that contain a substring
    // pub fn find_all_usearch(&self, s: &str) -> Vec<String> {
    //     // Convert the trie into a regular iterator of values
    //     let iter = self.iter();
    //     // Filter out the values that do not contain the substring
    //     let filtered = iter.filter(|value| self.search(s));
    //     // Collect the filtered values into a vector
    //     let results = filtered.collect();
    //     // Return the results vector
    //     results
    // }

    // Find all strings in the trie that contain a substring
    pub fn find_all(&self, s: &str) -> Vec<String> {
        // Create an empty vector to store the results
        let mut results = Vec::new();
        // Call a helper function to recursively traverse the trie and collect the matches
        self.find_all_helper(s, &mut results);
        // Return the results vector
        results
    }

    // Helper function for finding all strings that contain a substring
    fn find_all_helper(&self, s: &str, results: &mut Vec<String>) {
        // If this node has a value and it contains the substring, add it to the results vector
        if let Some(value) = &self.value {
            if value.name.contains(s) {
                for e in value.path.clone(){
                    results.push(e);
                }
            }
        }
        // Iterate over the children nodes and call this function recursively on each of them
        for child in self.children.values() {
            child.find_all_helper(s, results);
        }
    }
     // List all strings in the trie
     pub fn list_all(&self) -> Vec<String> {
        // Create an empty vector to store the results
        let mut results = Vec::new();
        // Call a helper function to recursively traverse the trie and collect all values
        self.list_all_helper(&mut results);
        // Return the results vector
        results
    }
     // Helper function for listing all strings in the trie
     fn list_all_helper(&self, results: &mut Vec<String>) {
        // If this node has a value, add it to the results vector
        if let Some(value) = &self.value {
             for e in value.path.clone(){
                results.push(e);
            }
        }
        // Iterate over the children nodes and call this function recursively on each of them
        for child in self.children.values() {
            child.list_all_helper(results);
        }
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
     let strings = trie.list_all();
     println!("{:?}", strings); // ["rust", "ruby", "python", "java", "javascript"]
    // Find all strings that contain "ru"
    let matches = trie.find_all("ru");
    println!("{:?}", matches); // ["rust", "ruby"]
}

