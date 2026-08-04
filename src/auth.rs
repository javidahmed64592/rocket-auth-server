use argon2::password_hash::PasswordVerifier;
use argon2::{Argon2, PasswordHash};
use rocket::Request;
use rocket::http::{Cookie, CookieJar, SameSite, Status};
use rocket::response::{self, Responder, Response};
use rocket::serde::json::Json;
use rocket::{Route, get, post, routes};
use rocket_auth_server::Credentials;
use rocket_db_pools::{Connection, sqlx};

use crate::db::UsersDb;

struct VerifyResponse {
    status: Status,
    user: Option<String>,
}

impl<'r> Responder<'r, 'static> for VerifyResponse {
    fn respond_to(self, _: &'r Request<'_>) -> response::Result<'static> {
        let mut builder = Response::build();
        builder.status(self.status);
        if let Some(user) = self.user {
            builder.raw_header("X-User", user);
        }
        Ok(builder.finalize())
    }
}
#[post("/login", data = "<creds>")]
async fn login(
    creds: Json<Credentials>,
    mut db: Connection<UsersDb>,
    cookies: &CookieJar<'_>,
) -> Status {
    let row: Option<(String, String)> =
        sqlx::query_as("SELECT username, password_hash FROM users WHERE username = ?")
            .bind(&creds.username)
            .fetch_optional(&mut **db)
            .await
            .unwrap_or(None);

    let (username, password_hash) = match row {
        Some(row) => row,
        None => return Status::Unauthorized,
    };

    let parsed_hash = match PasswordHash::new(&password_hash) {
        Ok(hash) => hash,
        Err(_) => return Status::InternalServerError,
    };

    match Argon2::default().verify_password(creds.password.as_bytes(), &parsed_hash) {
        Ok(()) => {
            let mut cookie = Cookie::new("session", username);
            cookie.set_domain(".lab.home.arpa");
            cookie.set_path("/");
            cookie.set_same_site(SameSite::Lax);
            cookies.add_private(cookie);
            Status::Ok
        }
        Err(_) => Status::Unauthorized,
    }
}

#[post("/logout")]
fn logout(cookies: &CookieJar<'_>) -> Status {
    let mut cookie = Cookie::new("session", "");
    cookie.set_domain(".lab.home.arpa");
    cookie.set_path("/");
    cookies.remove_private(cookie);
    Status::Ok
}

#[get("/verify")]
fn verify(cookies: &CookieJar<'_>) -> VerifyResponse {
    match cookies.get_private("session") {
        Some(cookie) => VerifyResponse {
            status: Status::Ok,
            user: Some(cookie.value().to_string()),
        },
        None => VerifyResponse {
            status: Status::Unauthorized,
            user: None,
        },
    }
}

pub fn routes() -> Vec<Route> {
    routes![login, logout, verify]
}
