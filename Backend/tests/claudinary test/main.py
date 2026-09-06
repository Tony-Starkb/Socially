

from fastapi import FastAPI, File, UploadFile
from fastapi.exceptions import HTTPException
from fastapi.responses import JSONResponse

from cloudinaryConfig import upload_to_cloudinary, fetch_media


app = FastAPI()


@app.post("/upload-file", status_code=200, response_model=dict)
async def upload_file(file: UploadFile = File(...)):
    # Process the uploaded file
    upload_to_cloudinary(file.file, file.filename)
    return {"filename": file.filename, "public_id": file.filename}


@app.get("/fetch-media/{public_id}", status_code=200, response_model=dict)
async def fetch_media_endpoint(public_id: str):
    try:
        result = fetch_media(public_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))