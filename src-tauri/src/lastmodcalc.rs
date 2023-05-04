use std::{fs, time::{SystemTime, Duration}};

use chrono::{DateTime, Local, Utc};
pub fn lastmodified(path:&str)->(String,i64){
  match(fs::metadata(path)){
    Ok(mp) => {
      // let metadata = fs::metadata(path.clone()).unwrap();
      let modified = mp.modified().unwrap();
      
    
    // get the metadata of the path
    
    // get the last modification time
    
    // get the current system time
    let now = SystemTime::now();
    
    // get the difference between now and modified
    let diff = now.duration_since(modified).unwrap();
    
    // create a duration of 7 days
    let seven_days = Duration::from_secs(7 * 24 * 60 * 60);
    let one_day = Duration::from_secs(1 * 24 * 60 * 60);
    
    let timestamp;
    let modified_date = DateTime::<Utc>::from(modified).with_timezone(&Local);
    timestamp=modified_date.timestamp();
    // timestamp=format!("{}",modified_date.timestamp());
    let now_date = DateTime::<Utc>::from(now).with_timezone(&Local);
    let relative_date = modified_date.format("%R %a").to_string();
    let absolute_date = modified_date.format("%d-%m-%y %H:%S").to_string();
    let date=if diff <= seven_days && diff > one_day {
    // format modified as a relative date
    let diff = now_date.signed_duration_since(modified_date);

    // get the number of days in the difference
    let days = diff.num_days();
    // println!("{} was modified {}", path, days);
    // relative_date
    format!("{} day(s) ago @ {} ",days,relative_date)
    // println!("{} was modified {}", path, relative_date);
    // relative_date
} else if diff <= one_day {
  // format modified as a relative date
  // let modified_date = DateTime::<Utc>::from(modified).with_timezone(&Local);

  // // let now_date = DateTime::<Utc>::from(now).with_timezone(&Local);
  // let relative_date = modified_date.format("%R").to_string();
  
  // println!("{} was modified {}", path, relative_date);
  relative_date
} else{
    // format modified as an absolute date
    // let modified_date = DateTime::<Utc>::from(modified).with_timezone(&Local);
    // println!("{} was modified on {}", path, absolute_date);
    absolute_date
};
    (date,timestamp)
  },
  Err(_) => {
    ("".to_string(),0)
  },
}
}