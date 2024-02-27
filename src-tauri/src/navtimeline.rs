use std::collections::VecDeque;
#[derive(Debug, Clone)]
pub struct Page {
    pub url: String,
    pub title: String,
}
#[derive(Debug, Default)]
pub struct BrowserHistory {
    pub browser_timeline: Vec<Page>,
    pub current_page: usize,
}

impl BrowserHistory {
    pub fn new() -> Self {
        Self {
            browser_timeline: Vec::new(),
            current_page: 0,
        }
    }

    pub fn visit_page(&mut self, url: String, title: String) {
        // When visiting a new page, add the current page to the back stack
        println!("Visited: {} - {}", url, title);
        if let Some(werethereany) = self.browser_timeline.get(self.current_page + 1).clone() {
            self.browser_timeline
                .splice(self.current_page + 1.., Vec::new());
        }
        self.browser_timeline.push(Page {
            url: url,
            title: title,
        });
        self.current_page = if (self.browser_timeline.len() < 1) {
            0
        } else {
            self.browser_timeline.len() - 1
        };
    }

    pub fn go_back(&mut self) -> Option<&Page> {
        let prevpageno = self.current_page.wrapping_sub(1);
        if let Some(page) = self.browser_timeline.get(prevpageno).clone() {
            self.current_page = prevpageno;
            Some(page)
        } else {
            None
        }
        // Go back to the previous page and move the current page to the forward stack
    }

    pub fn go_forward(&mut self) -> Option<&Page> {
        // Go forward to the next page and move the current page to the back stack

        if let Some(page) = self.browser_timeline.get(self.current_page + 1).clone() {
            self.current_page = self.current_page + 1;
            Some(page)
        } else {
            None
        }
    }

    pub fn get_current_page(&self) -> Option<&Page> {
        self.browser_timeline.get(self.current_page).clone()
    }
}

#[test]
fn tryout() {
    let mut history = BrowserHistory::new();
    history.visit_page("http://example.com".to_string(), "Example Home".to_string());
    println!("{:?}", history);
    history.visit_page(
        "http://example.com/about".to_string(),
        "About Us".to_string(),
    );
    println!("{:?}", history);
    if let Some(page) = history.go_back() {
        println!("Went back to: {} - {}", page.url, page.title);
    }
    println!("{:?}", history);
    // if let Some(page) = history.go_forward() {
    //     println!("Went forward to: {} - {}", page.url, page.title);
    // }
    // println!("{:?}",history);
    history.visit_page("http://example.com".to_string(), "Example Home".to_string());
    println!("{:?}", history);
    history.visit_page(
        "http://example.com/about".to_string(),
        "About Us".to_string(),
    );
    println!("{:?}", history);
    if let Some(page) = history.get_current_page() {
        println!("Current Page is: {} - {}", page.url, page.title);
    }
    println!("{:?}", history);
    if let Some(page) = history.go_forward() {
        println!("Went forward to: {} - {}", page.url, page.title);
    }
    println!("{:?}", history);
    if let Some(page) = history.go_forward() {
        println!("Went forward to: {} - {}", page.url, page.title);
    }
    println!("{:?}", history);
    if let Some(page) = history.go_back() {
        println!("Went back to: {} - {}", page.url, page.title);
    }
    println!("{:?}", history);
    if let Some(page) = history.go_back() {
        println!("Went back to: {} - {}", page.url, page.title);
    }
    println!("{:?}", history)
}
