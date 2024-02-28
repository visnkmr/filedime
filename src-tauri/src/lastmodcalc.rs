use std::{
    fs,
    time::{Duration, SystemTime},
};

use chrono::{DateTime, Local, Utc};

pub fn lastmodified(path: &str) -> (String, i64) {
    match fs::metadata(path) {
        Ok(mp) => {
            let modified = mp.modified().unwrap_or(SystemTime::UNIX_EPOCH);

            let now = SystemTime::now();

            let diff = now
                .duration_since(modified)
                .unwrap_or(Duration::from_secs(0));

            let seven_days = Duration::from_secs(7 * 24 * 60 * 60);
            let one_day = Duration::from_secs(1 * 24 * 60 * 60);

            let timestamp;
            let modified_date = DateTime::<Utc>::from(modified).with_timezone(&Local);
            timestamp = modified_date.timestamp();

            let now_date = DateTime::<Utc>::from(now).with_timezone(&Local);
            let relative_date = modified_date.format("%R %a").to_string();
            let absolute_date = modified_date.format("%d-%m-%y %H:%S").to_string();

            let date = if diff <= seven_days && diff > one_day {
                let diff = now_date.signed_duration_since(modified_date);
                let days = diff.num_days();
                format!("{} day(s) ago @ {} ", days, relative_date)
            } else if diff <= one_day {
                relative_date
            } else {
                absolute_date
            };

            (date, timestamp)
        }
        Err(_) => ("".to_string(), 0),
    }
}
