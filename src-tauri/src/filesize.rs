use std::collections::HashMap;
use std::fs;
use std::time::{Duration, Instant};

// Define a struct that holds the cache and the expiration time
pub struct FileSizeFinder {
    cache: HashMap<String, u64>,
    expiration: Duration,
}

impl FileSizeFinder {
    // Define a constructor that takes an expiration time in seconds
    pub fn new(expiration: u64) -> Self {
        Self {
            cache: HashMap::new(),
            expiration: Duration::from_secs(expiration),
        }
    }

    // Define a function that finds the size of a file or folder given its path
    pub fn find_size(&mut self, path: &str) -> u64 {
        // Check if the path is already in the cache
        if let Some(size) = self.cache.get(path) {
            // Return the cached size
            return *size;
        }

        // Get the metadata of the path
        let metadata = fs::metadata(path).unwrap();

        // Check if the path is a file or a folder
        let size = if metadata.is_file() {
            // If it is a file, get its size
            metadata.len()
        } else if metadata.is_dir() {
            // If it is a folder, loop over its entries and call this function recursively
            let mut total = 0;
            for entry in fs::read_dir(path).unwrap() {
                let entry = entry.unwrap();
                let entry_path = entry.path().to_string_lossy().to_string();
                total += self.find_size(&entry_path);
            }
            total
        } else {
            // If it is neither, return zero
            0
        };

        // Store the size in the cache with the current time as the value
        self.cache.insert(path.to_string(), size);

        // Return the size
        size
    }

    // Define a function that clears the cache of expired entries
    fn clear_cache(&mut self) {
        // Get the current time
        let now = Instant::now();

        // Loop over the cache entries and remove the ones that are older than the expiration time
        self.cache.retain(|_, &mut v| {
            // Convert the u64 value to a Duration value
            let duration = Duration::from_secs(v);
            // Subtract the Duration value from the current time
            let instant = now.checked_sub(duration).unwrap();
            // Compare the Instant values using duration_since()
            now.duration_since(instant) < self.expiration
        });
    }
}