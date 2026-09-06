"""
this file is used to implement the feeds related work or the feeds related functionalities for the user
- Personalized Home Feed    
    
 """
 
 
from fastapi import APIRouter, status, Depends
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from fastapi.encoders import jsonable_encoder

from sqlalchemy.orm import Session

from database import crud
from database import schemas

from services.dependencies import get_current_user, get_db

from typing import Annotated



feeds_router = APIRouter(prefix = "/api/v1/feeds", tags = ["feeds"])


@feeds_router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=schemas.FollowListResponse,
)
def home_feeds(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    username = current_user.username
    db_users = crud.get_user_following(db, username)

    feed_posts = []
    for profile_id in db_users["users"]:
        posts = crud.get_user_posts_id(db, profile_id)
        feed_posts.extend(posts)

    feed_posts.sort(key=lambda post: post.created_at, reverse=True)
        
    return JSONResponse(
        status_code = status.HTTP_200_OK,
        content={"posts": jsonable_encoder(feed_posts)},
    )