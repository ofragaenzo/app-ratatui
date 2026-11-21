mod diary;

use axum::{
    http::{header, HeaderValue, Method},
    routing::get,
    Json, Router,
};
use serde::Serialize;
use std::{env, net::SocketAddr};
use tower_http::{cors::CorsLayer, trace::TraceLayer};

#[derive(Serialize)]
struct ApiInfo {
    name: &'static str,
    version: &'static str,
    status: &'static str,
}

#[derive(Serialize)]
struct Health {
    status: &'static str,
}

async fn index() -> Json<ApiInfo> {
    Json(ApiInfo {
        name: "Prato a Prato API",
        version: "0.1.0",
        status: "em desenvolvimento",
    })
}

async fn health() -> Json<Health> {
    Json(Health { status: "ok" })
}

#[tokio::main]
async fn main() {
    let supabase = diary::Supabase::from_env().expect("validar configuração do Supabase");
    let origin = env::var("API_WEB_ORIGIN").unwrap_or_else(|_| "http://localhost:8082".into());
    let cors = CorsLayer::new()
        .allow_origin(
            origin
                .parse::<HeaderValue>()
                .expect("API_WEB_ORIGIN inválida"),
        )
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE]);

    let app = Router::new()
        .route("/", get(index))
        .route("/health", get(health))
        .merge(diary::router(supabase))
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr: SocketAddr = env::var("API_BIND_ADDR")
        .unwrap_or_else(|_| "127.0.0.1:3000".into())
        .parse()
        .expect("API_BIND_ADDR inválido");
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("bind API listener");
    println!(
        "API ouvindo em http://{}",
        listener.local_addr().expect("endereço da API")
    );
    axum::serve(listener, app).await.expect("serve API");
}
