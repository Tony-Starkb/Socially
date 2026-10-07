from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, EmailStr, model_validator




class Role(str, Enum):
    user = "user"
    moderator = "moderator"  
    admin = "admin"


class PostCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    caption: str = Field(min_length=1, max_length=2200)
    image_url: str | None = None
    media_urls: list[str] | None = Field(default=None, min_length=1)

    @model_validator(mode="after")
    def require_media(self):
        if self.media_urls is None:
            if self.image_url is None:
                raise ValueError("Provide at least one media URL.")
            self.media_urls = [self.image_url]
        elif self.image_url is None:
            self.image_url = self.media_urls[0]
        return self


class PostUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    caption: str | None = Field(default=None, min_length=1, max_length=2200)
    image_url: str | None = None
    media_urls: list[str] | None = Field(default=None, min_length=1)


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    username: str
    caption: str
    image_url: AnyHttpUrl
    media_urls: list[AnyHttpUrl]
    like_count: int
    comment_count: int
    created_at: datetime
    updated_at: datetime | None = None


class UserBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    username: str = Field(min_length=3, max_length=50)
    full_name: Optional[str] = Field(default=None, max_length=100)
    bio: Optional[str] = Field(default=None, max_length=150)
    avatar_url: Optional[AnyHttpUrl] = None


class UserCreate(UserBase):
    email: EmailStr
    password: str = Field(min_length=8)
    
    
class FollowListResponse(BaseModel):
    username: str           # whose list this is
    users: list[str]        # list of usernames
    count: int


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[AnyHttpUrl] = None
    is_private: Optional[bool] = None


class UserPublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    username: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[AnyHttpUrl] = None
    is_private: bool
    follower_count: int = 0
    following_count: int = 0
    post_count: int = 0


class UserInDB(UserPublicResponse):
    # internal schema that includes fields not exposed publicly
    email: EmailStr
    password_hash: str
    role: Role = Role.user


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

  
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RefreshTokenCreate(BaseModel):
    id: str
    user_id: str
    token: str
    is_revoked: bool = False
    created_at: datetime
    expires_at: datetime


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str
