"""Supabase JWT verification (security-critical).

The user's identity comes ONLY from the verified token's `sub` claim, never
from request bodies or query params. Signature and expiry are validated with
SUPABASE_JWT_SECRET (HS256) or, when SUPABASE_JWKS_URL is set, the project's
asymmetric keys. Missing/invalid/expired tokens are rejected with 401.
"""

import os
from functools import lru_cache
from typing import Annotated, Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer(auto_error=False)
_AUDIENCE = "authenticated"  # Supabase's audience for user access tokens


@lru_cache(maxsize=1)
def _jwks_client(url: str) -> jwt.PyJWKClient:
    return jwt.PyJWKClient(url)


def decode_token(token: str) -> dict[str, Any]:
    """Verify a Supabase JWT (signature, expiry, audience) and return its
    claims. Raises jwt.PyJWTError on any failure. Also used by the rate
    limiter to key buckets by user."""
    jwks_url = os.environ.get("SUPABASE_JWKS_URL")
    if jwks_url:  # project uses asymmetric signing keys
        key = _jwks_client(jwks_url).get_signing_key_from_jwt(token).key
        claims = jwt.decode(token, key, algorithms=["RS256", "ES256"], audience=_AUDIENCE)
    else:
        secret = os.environ["SUPABASE_JWT_SECRET"]
        claims = jwt.decode(token, secret, algorithms=["HS256"], audience=_AUDIENCE)
    return dict(claims)

def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> str:
    """The verified user id (JWT `sub`). Raises 401 otherwise."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise unauthorized
    try:
        claims = decode_token(credentials.credentials)
    except jwt.PyJWTError:
        raise unauthorized from None
    sub = claims.get("sub")
    if not isinstance(sub, str) or not sub:
        raise unauthorized
    return sub

UserId = Annotated[str, Depends(get_current_user)]
