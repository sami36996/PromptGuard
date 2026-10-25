"""Common Pydantic schemas."""
from pydantic import BaseModel
from typing import Optional, List, Generic, TypeVar


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None


class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int


T = TypeVar("T")

class PaginatedDataResponse(PaginatedResponse, Generic[T]):
    items: List[T]