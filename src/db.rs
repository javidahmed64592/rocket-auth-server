use rocket_db_pools::{Database, sqlx};

#[derive(Database)]
#[database("users_db")]
pub struct UsersDb(sqlx::SqlitePool);

pub fn ensure_users_db_exists() {
    let figment = rocket::Config::figment();
    let url: String = figment
        .extract_inner("databases.users_db.url")
        .expect("set databases.users_db.url in Rocket.toml or ROCKET_DATABASES env var");

    let path = url
        .trim_start_matches("file:")
        .split('?')
        .next()
        .unwrap_or(&url);

    if !std::path::Path::new(path).exists() {
        eprintln!(
            "Users database not found at '{}'.\nRun the create-user tool first to create it.",
            path
        );
        std::process::exit(1);
    }
}
