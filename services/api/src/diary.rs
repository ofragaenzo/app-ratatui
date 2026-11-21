use axum::{
    extract::{DefaultBodyLimit, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use reqwest::{redirect::Policy, Client, Method, RequestBuilder, Url};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::{env, time::Duration};

const MEALS_COLUMNS: &str = "id,title,category,caption,ingredients,created_at";

#[derive(Clone)]
pub struct Supabase {
    base: Url,
    publishable_key: String,
    client: Client,
}

impl Supabase {
    pub fn from_env() -> Result<Option<Self>, &'static str> {
        let url = env::var("SUPABASE_URL").ok();
        let key = env::var("SUPABASE_PUBLISHABLE_KEY").ok();
        let (url, publishable_key) = match (url, key) {
            (None, None) => return Ok(None),
            (Some(url), Some(key)) => (url, key),
            _ => return Err("preencha SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY"),
        };
        let base = Url::parse(&url).map_err(|_| "SUPABASE_URL inválida")?;
        let local_http = base.scheme() == "http"
            && matches!(base.host_str(), Some("localhost" | "127.0.0.1" | "[::1]"));
        if !(base.scheme() == "https" || local_http)
            || base.host_str().is_none()
            || !base.username().is_empty()
            || base.password().is_some()
            || base.path() != "/"
            || base.query().is_some()
            || base.fragment().is_some()
        {
            return Err("SUPABASE_URL deve conter a origem HTTPS do projeto");
        }
        if !publishable_key.starts_with("sb_publishable_")
            || publishable_key.len() == "sb_publishable_".len()
            || !publishable_key
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || b"_-".contains(&byte))
        {
            return Err("use a chave pública sb_publishable_ do projeto");
        }
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .redirect(Policy::none())
            .build()
            .map_err(|_| "não foi possível inicializar o cliente HTTP")?;
        Ok(Some(Self {
            base,
            publishable_key,
            client,
        }))
    }

    fn request(&self, method: Method, path: &str, token: &str) -> RequestBuilder {
        let mut url = self.base.clone();
        url.set_path(path);
        self.client
            .request(method, url)
            .header("apikey", &self.publishable_key)
            .bearer_auth(token)
    }

    async fn user(&self, token: &str) -> Result<User, ApiError> {
        let user: User = decode(self.request(Method::GET, "/auth/v1/user", token)).await?;
        if user.role != "authenticated" {
            return Err(ApiError::unauthorized());
        }
        Ok(user)
    }
}

#[derive(Deserialize)]
struct User {
    id: String,
    role: String,
}

#[derive(Serialize)]
struct Session {
    id: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum Category {
    Breakfast,
    Lunch,
    Snack,
    Dinner,
}

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct NewMeal {
    title: String,
    category: Category,
    #[serde(default)]
    caption: String,
    #[serde(default)]
    ingredients: String,
}

impl NewMeal {
    fn normalize(mut self) -> Result<Self, ApiError> {
        self.title = self.title.trim().to_owned();
        self.caption = self.caption.trim().to_owned();
        self.ingredients = self.ingredients.trim().to_owned();
        if self.title.is_empty() || self.title.chars().count() > 80 {
            return Err(ApiError(
                StatusCode::BAD_REQUEST,
                "Use um título de 1 a 80 caracteres.",
            ));
        }
        if self.caption.chars().count() > 240 || self.ingredients.chars().count() > 1000 {
            return Err(ApiError(
                StatusCode::BAD_REQUEST,
                "Use até 240 caracteres na legenda e 1000 nos ingredientes.",
            ));
        }
        if [&self.title, &self.caption, &self.ingredients]
            .iter()
            .any(|value| value.contains('\0'))
        {
            return Err(ApiError(
                StatusCode::BAD_REQUEST,
                "O registro contém um caractere inválido.",
            ));
        }
        Ok(self)
    }
}

#[derive(Serialize, Deserialize)]
struct Meal {
    id: String,
    title: String,
    category: Category,
    caption: String,
    ingredients: String,
    created_at: String,
}

#[derive(Serialize)]
struct MealList {
    meals: Vec<Meal>,
}

struct ApiError(StatusCode, &'static str);

impl ApiError {
    fn unauthorized() -> Self {
        Self(
            StatusCode::UNAUTHORIZED,
            "Entre na sua conta para acessar o diário.",
        )
    }

    fn upstream() -> Self {
        Self(
            StatusCode::BAD_GATEWAY,
            "O Supabase não conseguiu concluir a solicitação.",
        )
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let mut response = (self.0, Json(serde_json::json!({ "error": self.1 }))).into_response();
        if self.0 == StatusCode::UNAUTHORIZED {
            response
                .headers_mut()
                .insert(header::WWW_AUTHENTICATE, "Bearer".parse().unwrap());
        }
        response
    }
}

async fn decode<T: DeserializeOwned>(request: RequestBuilder) -> Result<T, ApiError> {
    let response = request.send().await.map_err(|_| ApiError::upstream())?;
    match response.status() {
        status if status.is_success() => response.json().await.map_err(|_| ApiError::upstream()),
        StatusCode::UNAUTHORIZED => Err(ApiError::unauthorized()),
        StatusCode::FORBIDDEN => Err(ApiError(StatusCode::FORBIDDEN, "Acesso negado.")),
        StatusCode::TOO_MANY_REQUESTS => Err(ApiError(
            StatusCode::TOO_MANY_REQUESTS,
            "Tente novamente em instantes.",
        )),
        _ => Err(ApiError::upstream()),
    }
}

fn session_request<'a>(
    supabase: &'a Option<Supabase>,
    headers: &'a HeaderMap,
) -> Result<(&'a Supabase, &'a str), ApiError> {
    let supabase = supabase.as_ref().ok_or(ApiError(
        StatusCode::SERVICE_UNAVAILABLE,
        "O Supabase ainda não foi configurado.",
    ))?;
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split_once(' '))
        .filter(|(scheme, token)| {
            scheme.eq_ignore_ascii_case("Bearer")
                && !token.is_empty()
                && !token.contains(char::is_whitespace)
        })
        .map(|(_, token)| token)
        .ok_or_else(ApiError::unauthorized)?;
    Ok((supabase, token))
}

async fn me(
    State(supabase): State<Option<Supabase>>,
    headers: HeaderMap,
) -> Result<Json<Session>, ApiError> {
    let (supabase, token) = session_request(&supabase, &headers)?;
    let user = supabase.user(token).await?;
    Ok(Json(Session { id: user.id }))
}

async fn list(
    State(supabase): State<Option<Supabase>>,
    headers: HeaderMap,
) -> Result<Json<MealList>, ApiError> {
    let (supabase, token) = session_request(&supabase, &headers)?;
    supabase.user(token).await?;
    let meals = decode(
        supabase
            .request(Method::GET, "/rest/v1/diary_meals", token)
            .query(&[
                ("select", MEALS_COLUMNS),
                ("order", "created_at.desc,id.desc"),
                ("limit", "50"),
            ]),
    )
    .await?;
    Ok(Json(MealList { meals }))
}

async fn create(
    State(supabase): State<Option<Supabase>>,
    headers: HeaderMap,
    Json(meal): Json<NewMeal>,
) -> Result<(StatusCode, Json<Meal>), ApiError> {
    let (supabase, token) = session_request(&supabase, &headers)?;
    let meal = meal.normalize()?;
    supabase.user(token).await?;
    let meals: Vec<Meal> = decode(
        supabase
            .request(Method::POST, "/rest/v1/diary_meals", token)
            .query(&[("select", MEALS_COLUMNS)])
            .header("Prefer", "return=representation")
            .json(&meal),
    )
    .await?;
    let meal = meals.into_iter().next().ok_or_else(ApiError::upstream)?;
    Ok((StatusCode::CREATED, Json(meal)))
}

pub fn router(supabase: Option<Supabase>) -> Router {
    Router::new()
        .route("/v1/me", get(me))
        .route("/v1/meals", get(list).post(create))
        .layer(DefaultBodyLimit::max(16 * 1024))
        .with_state(supabase)
}
