

import os
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
import cloudinary.api
from cloudinary import CloudinaryImage, CloudinaryVideo


load_dotenv()
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("API_KEY")
CLOUDINARY_API_SECRET = os.getenv("API_SECRET")


cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
)


def upload_to_cloudinary(file_path: str, public_id: str):
    
    cloudinary.uploader.upload( file_path,
        asset_folder = "test",
        public_id = public_id,
        overwrite = True,
    )
    
    
def fetch_media(public_id):
     result = cloudinary.api.resource(public_id)
     print(result)
     return result
 