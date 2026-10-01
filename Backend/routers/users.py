from fastapi import APIRouter, Depends, status, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database.schemas import UserPublicResponse, PostResponse, FollowListResponse
from core.exceptions import UserNotFound
from services.dependencies import get_db, get_current_user
from database.crud import get_public_user, get_user_by_username as crud_get_user_by_username, get_user_posts, get_user_followers as crud_get_user_followers,get_user_following as crud_get_user_following, follow_a_user, unfollow_a_user, search_users as crud_search_users
from typing import Annotated
from fastapi.exceptions import HTTPException


users_router = APIRouter(prefix = "/api/v1/users", tags = ["users"])


@users_router.get("/search", status_code = status.HTTP_200_OK)
def search_for_users(
    q: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    if not q or not q.strip():
        return {"query": q, "results": []}

    matches = crud_search_users(db, q.strip(), current_username=current_user.username)
    return {
        "query": q,
        "results": [UserPublicResponse(**m).model_dump() for m in matches],
    }


@users_router.get("/{username}", status_code = status.HTTP_200_OK)
def get_user_by_username(username: str, request: Request, db: Session = Depends(get_db)):
    db_user = get_public_user(db, username)
    if db_user is None:
        raise UserNotFound(username)
    return UserPublicResponse(**db_user).model_dump()



@users_router.get("/{username}/posts", status_code = status.HTTP_200_OK, response_model=list[PostResponse])
def get_users_posts(username: str, request: Request, db: Session = Depends(get_db)):
    db_user = crud_get_user_by_username(db, username)
    if db_user is None:
        raise UserNotFound(username)
    
    return get_user_posts(db, username)
    
    
@users_router.get("/{username}/followers", status_code=status.HTTP_200_OK)
def get_user_followers_route(username: str, request: Request, db: Session = Depends(get_db)):
    db_user = crud_get_user_by_username(db, username)
    if db_user is None:
        raise UserNotFound(username)
    
    user_followers = crud_get_user_followers(db, username)
    
    return {
        "username": username,
        "users": [f.follower_id for f in user_followers],
        "count": len(user_followers),
    }
    
    
@users_router.get("/{username}/following", status_code = status.HTTP_200_OK)
def get_user_following_route(username: str, request: Request, db: Session = Depends(get_db)):
    db_user = crud_get_user_by_username(db, username)
    if db_user is None:
        raise UserNotFound(username)
    
    user_following = crud_get_user_following(db, username)
    
    return {
        "username": username,
        "users": [f.following_id for f in user_following],
        "count": len(user_following)
    }

@users_router.post("/{username}/follow", status_code = status.HTTP_200_OK)
def follow_user(
    username: str,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    status_name, user = follow_a_user(db, username, current_user.id)
    if status_name == "self-follow":
        raise HTTPException(status_code=400, detail="You cannot follow yourself.")
    if status_name == "missing":
        raise UserNotFound(id)
    if status_name == "already-followed":
        ## if an account is already followed by the authenticated user the call the unfollow feature instead of returning a 409 error. 
        ## This is to avoid confusion and to make the API more user-friendly.
        unfollow_a_user(db, username, current_user.id)
        return {"message": "User Unfollowed.", "user": username}
    
    return {"message": "User Followed.", "user": username}




"""
@users_router.delete("/{username}/follow", status_code = status.HTTP_204_NO_CONTENT)
def unfollow_user(
    username: str,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
	status_name, user = unfollow_a_user(db, username, current_user.id)
	if status_name == "missing":
		raise UserNotFound(username)
	if status_name == "not-followed":
		raise HTTPException(status_code=409, detail="You have not followed this user.")
	return Response(status_code=status.HTTP_204_NO_CONTENT)
"""




## return user followers list
@users_router.get("/{username}/followers/list", status_code=status.HTTP_200_OK, response_model=FollowListResponse)
def get_user_followers(db: Session = Depends(get_db), username: str = None):
    db_user = crud_get_user_by_username(db, username)
    if db_user is None:
        raise UserNotFound(username)
    
    user_followers = crud_get_user_followers(db, username)
    
    return FollowListResponse(
        username=username,
        users=[f.follower_id for f in user_followers],
        count=len(user_followers),
    )
    
    
## return user following list
@users_router.get("/{username}/following/list", status_code=status.HTTP_200_OK, response_model=FollowListResponse)
def get_user_following(db: Session = Depends(get_db), username: str = None):
    db_user = crud_get_user_by_username(db, username)
    if db_user is None:
        raise UserNotFound(username)
    
    user_following = crud_get_user_following(db, username)
    
    return FollowListResponse(
        username=username,
        users=[f.following_id for f in user_following],
        count=len(user_following),
    )
    

## check whether the requested user follows the authenticated user.
@users_router.get("/{username}/is_follower", status_code=status.HTTP_200_OK)
def is_user_follower(
    username: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    db_user = crud_get_user_by_username(db, username)
    if db_user is None:
        raise UserNotFound(username)

    user_following = crud_get_user_following(db, username)
    is_follower = any(follow.following_id == current_user.id for follow in user_following)

    return {"is_follower": is_follower}


## check whether the requested user is followed by the authenticated user
@users_router.get("/{username}/is_following", status_code=status.HTTP_200_OK)
def is_user_following(
    username: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    db_user = crud_get_user_by_username(db, username)
    if db_user is None:
        raise UserNotFound(username)

    user_followers = crud_get_user_followers(db, username)
    is_following = any(follow.follower_id == current_user.id for follow in user_followers)

    return {"is_following": is_following}