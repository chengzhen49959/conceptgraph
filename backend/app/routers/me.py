from fastapi import APIRouter, Depends

from app.auth import CurrentUser, get_current_user

router = APIRouter(prefix="/api", tags=["me"])


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)) -> dict[str, str | None]:
    """Return the caller's identity, proving the token reached and validated here."""
    return {"id": user.id, "email": user.email}
