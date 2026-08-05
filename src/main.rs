#[macro_use]
extern crate rocket;

mod auth;
mod db;

use auth::CookieDomain;
use db::{UsersDb, ensure_users_db_exists};
use rocket::fs::{FileServer, NamedFile};
use rocket_auth_server::static_dir;
use rocket_db_pools::Database;

#[get("/health")]
fn health() -> &'static str {
    "OK"
}

#[get("/<_..>", rank = 20)]
async fn spa_fallback() -> Option<NamedFile> {
    NamedFile::open(static_dir().join("index.html")).await.ok()
}

#[launch]
fn rocket() -> _ {
    dotenvy::dotenv().ok();
    let cookie_domain =
        CookieDomain(std::env::var("AUTH_COOKIE_DOMAIN").expect("AUTH_COOKIE_DOMAIN must be set"));
    ensure_users_db_exists();

    rocket::build()
        .manage(cookie_domain)
        .attach(UsersDb::init())
        .mount("/api", routes![health])
        .mount("/api", auth::routes())
        .mount("/", FileServer::from(static_dir()).rank(10))
        .mount("/", routes![spa_fallback])
}
