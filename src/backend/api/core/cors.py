from fastapi.middleware.cors import CORSMiddleware

def init_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],  # frontend URL to be accessed in browser
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )