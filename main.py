# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# import uvicorn
# from app.routes.analyze import router as analyze_router
# from app.services.static_analysis import analyze_code
# import os
# from contextlib import asynccontextmanager

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup
#     print("Pyzer v4.0 started")
#     print("Supports 1000+ error types and 9 Big-O complexities")
#     yield
#     # Shutdown
#     print("Pyzer shutting down")

# app = FastAPI(
#     title="Pyzer - Python Code Analyzer",
#     description="""
# Pyzer delivers clear, structured code analysis:
# - 1000+ error types detected
# - 9 Big-O complexity types  
# - Framework-aware (Django/Flask/Pandas/Numpy/TensorFlow)
# - Automatic error fixing
# - Production-grade scoring system""",
#     version="4.0.0",
#     docs_url="/docs",
#     redoc_url="/redoc",
#     lifespan=lifespan
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:3000",
#         "http://127.0.0.1:3000", 
#         "https://yourdomain.com",
#         "*"
#     ],
#     allow_credentials=True,
#     allow_methods=["GET", "POST", "PUT", "DELETE"],
#     allow_headers=["*"],
# )

# app.include_router(analyze_router, prefix="/api/v1", tags=["analysis"])

# @app.get("/", tags=["home"])
# async def root():
#     return {
#         "status": "Pyzer v4.0 - Ready",
#         "features": [
#             "1000+ error patterns detected",
#             "9 Big-O types: O(1), O(n), O(n log n), O(n^2), O(n^3), O(n^4), O(2^n), O(c^n), O(n!)", 
#             "Any library/framework supported",
#             "Automatic error correction",
#             "Trust scoring system (0-10)",
#             "Secure sandbox execution"
#         ],
#         "endpoints": {
#             "analyze": "POST /api/v1/analyze", 
#             "docs": "/docs",
#             "health": "/health"
#         },
#         "usage": """curl -X POST http://localhost:8000/api/v1/analyze \\
#   -H "Content-Type: application/json" \\
#   -d '{{"code": "print(1/0)"}}'"""
#     }

# @app.get("/health", tags=["health"])
# async def health_check():
#     try:
#         test_code = "print('health check')"
#         result = analyze_code(test_code)
        
#         return {
#             "status": "healthy",
#             "services": {
#                 "static_analysis": "OK",
#                 "error_detection": len(result["errors"]) == 0,
#                 "big_o_calculation": result["complexity"]["big_o"] == "O(1)"
#             },
#             "timestamp": os.getenv("TIMESTAMP", "now")
#         }
#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={"status": "unhealthy", "error": str(e)}
#         )

# @app.get("/ping", tags=["health"])
# async def ping():
#     return {"ping": "pong"}

# @app.exception_handler(404)
# async def not_found_handler(request, exc):
#     return JSONResponse(
#         status_code=404,
#         content={
#             "error": "Endpoint not found", 
#             "available": ["/", "/health", "/api/v1/analyze"]
#         }
#     )

# @app.exception_handler(500)
# async def server_error_handler(request, exc):
#     return JSONResponse(
#         status_code=500,
#         content={"error": "Internal server error", "retry": True}
#     )

# # Lifespan handled above

# if __name__ == "__main__":
#     uvicorn.run(
#         "main:app",
#         host="0.0.0.0",
#         port=8000,
#         reload=True,
#         log_level="info"
#     )






from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from app.routes.analyze import router as analyze_router
from app.services.static_analysis import analyze_code
import os
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Pyzer v4.0 started")
    print("Supports 1000+ error types and 9 Big-O complexities")
    yield
    # Shutdown
    print("Pyzer shutting down")

app = FastAPI(
    title="Pyzer - Python Code Analyzer",
    description="""
Pyzer delivers clear, structured code analysis:
- 1000+ error types detected
- 9 Big-O complexity types  
- Framework-aware (Django/Flask/Pandas/Numpy/TensorFlow)
- Automatic error fixing
- Production-grade scoring system""",
    version="4.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "https://yourdomain.com",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api/v1", tags=["analysis"])

@app.get("/", tags=["home"])
async def root():
    return {
        "status": "Pyzer v4.0 - Ready",
        "features": [
            "1000+ error patterns detected",
            "9 Big-O types: O(1), O(n), O(n log n), O(n^2), O(n^3), O(n^4), O(2^n), O(c^n), O(n!)", 
            "Any library/framework supported",
            "Automatic error correction",
            "Trust scoring system (0-10)",
            "Secure sandbox execution"
        ],
        "endpoints": {
            "analyze": "POST /api/v1/analyze", 
            "docs": "/docs",
            "health": "/health"
        },
        "usage": """curl -X POST http://localhost:8000/api/v1/analyze \\
  -H "Content-Type: application/json" \\
  -d '{{"code": "print(1/0)"}}'"""
    }

@app.get("/health", tags=["health"])
async def health_check():
    try:
        test_code = "print('health check')"
        result = analyze_code(test_code)
        
        return {
            "status": "healthy",
            "services": {
                "static_analysis": "OK",
                "error_detection": len(result["errors"]) == 0,
                "big_o_calculation": result["complexity"]["big_o"] == "O(1)"
            },
            "timestamp": os.getenv("TIMESTAMP", "now")
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.get("/ping", tags=["health"])
async def ping():
    return {"ping": "pong"}

# No custom 404 handler to avoid blocking new routes

@app.exception_handler(500)
async def server_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "retry": True}
    )

# Lifespan handled above

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False if os.environ.get("PORT") else True,
        log_level="info"
    )