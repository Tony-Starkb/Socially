"""
In this module, we define a middleware that generates a unique 
request ID for each incoming HTTP request. This request ID can be used 
for logging, tracing, and debugging purposes throughout the application.
The middleware will add the request ID to the request context, allowing it to be 
accessed in any part of the application that handles the request.

"""
import uuid
from fastapi import Request


async def add_request_id_to_header(request: Request, call_next):
    
    """First we check if the incoming request already have a request id or not"""
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())

    request.state.request_id = request_id    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

