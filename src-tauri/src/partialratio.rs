use strsim::normalized_levenshtein;

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
        let score = normalized_levenshtein(shorter, substr) * 100.0;
        // Update the best matching score if it is higher than the current one
        if score > best {
            best = score;
        }
    }

    // Return the best matching score as an integer between 0 and 100
    best as i32
}