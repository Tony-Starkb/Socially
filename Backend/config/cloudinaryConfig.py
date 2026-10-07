

import os
from dotenv import load_dotenv

import cloudinary
import cloudinary.uploader
import cloudinary.api
from cloudinary import CloudinaryImage, CloudinaryVideo



load_dotenv()
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")


cloudinary.config(
    cloud_name = CLOUDINARY_CLOUD_NAME,
    api_key = CLOUDINARY_API_KEY,
    api_secret = CLOUDINARY_API_SECRET,
)


def postMedia(file, publicID: str, resource_type: str = "image"):
    """Uploads a file to Cloudinary and returns the full result dict
    (including result['secure_url'], which is what gets stored in
    Post.image_url)."""

    result = cloudinary.uploader.upload(
        file,
        asset_folder = "InstaCore",
        public_id = publicID,
        overwrite = False,
        resource_type = resource_type,
    )
    return result
    
    
def fetchMedia(publicID: str):
    
    result = cloudinary.api.resource(publicID)
    return result