# FRONTEND-BACKEND INTEGRATION REPORT

## Scope

This report documents the current frontend integration state for the Fan Hub Plus Flask backend, based on direct reading of the current frontend code.

This is a factual code review, not a guess.

---

## 1) Shared HTTP client / API wrapper

File:

- frontend/src/shared/http/client.ts

Observed code:

```ts
export const API_BASE_URL = "/api";
export const serverMode =
  typeof window !== "undefined" && window.FANHUB_RUNTIME?.api === true;

const ACCESS_TOKEN_KEY = "fanhub_access_token";
const REFRESH_TOKEN_KEY = "fanhub_refresh_token";

export function getAccessToken(): string | null {
  return typeof localStorage !== "undefined"
    ? localStorage.getItem(ACCESS_TOKEN_KEY)
    : null;
}

export function getRefreshToken(): string | null {
  return typeof localStorage !== "undefined"
    ? localStorage.getItem(REFRESH_TOKEN_KEY)
    : null;
}

export function setTokens(access: string, refresh?: string) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    }
  }
}
```

Notes:

- No axios instance found.
- The shared client uses `fetch` + helper functions.
- Access/refresh tokens are stored in `localStorage`.

Refresh rotation handling:

```ts
if (response.status === 401 && getRefreshToken() && path !== "/auth/refresh") {
  const refreshRes = await fetchWithTimeout(
    apiUrl("/auth/refresh"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh_token: getRefreshToken() }),
    },
    10_000,
  );

  if (refreshRes.ok) {
    const refreshData: any = await readJson(refreshRes);
    const newAccessToken = refreshData?.access_token;
    const newRefreshToken = refreshData?.refresh_token;
    if (newAccessToken) {
      setTokens(newAccessToken, newRefreshToken ?? undefined);
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      response = await fetchWithTimeout(
        apiUrl(path),
        {
          ...requestInit,
          method,
          headers,
        },
        timeoutMs,
      );
    }
  } else {
    clearTokens();
  }
}
```

Conclusion:

- There is a refresh interceptor-like retry in the shared client.
- It updates both access and refresh token when a refresh response contains a new refresh token.

---

## 2) Auth API current implementation

File:

- frontend/src/features/auth/api.ts

Observed code:

```ts
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  captcha_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  captcha_token: string;
}

export const authApi = {
  async me(signal?: AbortSignal): Promise<{ user: User | null }> {
    const res = await apiClient.get<any>("/auth/me", { signal });
    return { user: res?.user || res || null };
  },

  async login(email: string, password: string, captchaToken: string) {
    const result = await apiClient.post<any>("/auth/login", {
      email,
      password,
      captcha_token: captchaToken,
    });
    if (result?.access_token) {
      setTokens(result.access_token, result.refresh_token);
    }
    return { user: result.user as User };
  },

  async register(input: RegisterRequest): Promise<RegisterResponse> {
    const result = await apiClient.post<any>("/auth/register", {
      name: input.name,
      email: input.email,
      password: input.password,
      captcha_token: input.captcha_token,
    });
    return {
      user: result.user as User,
      message: result.message ?? "",
    };
  },
};
```

Conclusion:

- API method signatures expect `captcha_token` in both login/register.
- The code tries to follow the backend contract structurally.

---

## 3) AuthProvider current behavior

File:

- frontend/src/features/auth/AuthProvider.tsx

Observed code:

```tsx
const login = useCallback(
  async (email: string, password: string) => {
    setError(null);
    try {
      const next = serverMode
        ? (await authApi.login(email, password)).user
        : repository.currentUser(await repository.login(email, password));
      if (!next) throw new Error("The authenticated user could not be loaded.");
      applyUser(next);
      return next;
    } catch (cause) {
      setError(messageOf(cause));
      throw cause;
    }
  },
  [applyUser],
);
```

And:

```tsx
const refresh = useCallback(async () => {
  setStatus("loading");
  setError(null);
  try {
    const next = serverMode
      ? (await authApi.me()).user
      : repository.currentSessionUser();
    applyUser(next);
    return next;
  } catch (cause) {
    setUser(null);
    setStatus("unauthenticated");
    setError(messageOf(cause));
    if (serverMode) repository.syncLegacyAuthShadow(null);
    return null;
  }
}, [applyUser]);
```

Conclusion:

- AuthProvider does not directly call `/auth/refresh` in the provider itself.
- The refresh logic lives in the shared HTTP client layer instead.

---

## 4) Auth form current payloads

File:

- frontend/src/pages/Auth.tsx

Observed login flow:

```tsx
if (mode === "login") {
  const u = await login(email, password);
  navigate(
    params.get("next")
      ? safeReturnPath(params.get("next"))
      : u.role === "admin"
        ? "/admin"
        : "/dashboard",
  );
}
```

Observed register flow:

```tsx
if (serverMode) {
  await authApi.register({
    name,
    email,
    password,
    favoriteCategories: interests,
  });
}
```

Conclusion:

- Register payload currently includes a `favoriteCategories` field that is not in the backend Ground Truth.
- Login payload currently does not include `captcha_token` at the form call site.
- This does not match the Ground Truth requirement exactly.

---

## 5) Current profile API mismatch

Files:

- frontend/src/features/profile/api.ts
- frontend/src/features/profile/dataSource.ts
- frontend/src/pages/Account.tsx

Observed profile API:

```ts
export const profileApi = {
  current: (signal?: AbortSignal) =>
    apiClient.get<{ user: User | null }>("/auth/me", { signal }),

  update: (patch: ProfileServerPatch, signal?: AbortSignal) =>
    apiClient.patch<{ user: User }>("/auth/profile", patch, { signal }),
};
```

Observed profile save logic:

```tsx
const result = await save({
  name,
  bio,
  favoriteCategories: cats,
  favoriteFandoms: fandoms
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  avatar,
});
```

Conclusion:

- Current frontend calls `/auth/me` and `/auth/profile`, not `/users/me`.
- It does not use backend contract fields `favorite_fandoms` and `display_preferences` as array/object payloads.
- This is a mismatch against Ground Truth.

---

## 6) Feedback current behavior

File:

- frontend/src/pages/Account.tsx

Observed form submit:

```tsx
if (
  await perform(
    () => repository.feedback(type, message),
    "Feedback saved to the demo review queue.",
  )
) {
  setMessage("");
  setDone(true);
}
```

Repository logic:

```ts
if (serverMode) {
  await api(
    "/feedback",
    json("POST", {
      type,
      content: message.trim(),
    }),
  );
}
```

Conclusion:

- The field names are correct (`type`, `content`) for the backend contract.
- However, the UI still includes demo text such as "Send demo feedback" and "stored locally".
- This indicates a hybrid demo/server flow, not a fully clean backend contract flow.

---

## 7) Error handling current logic

File:

- frontend/src/shared/http/client.ts

Observed code:

```ts
function failureFrom(payload: any, status: number) {
  const msg =
    payload?.message ||
    payload?.error?.message ||
    payload?.error ||
    `Request failed (${status}).`;
  return new ApiError(msg, status, payload?.error?.requestId);
}
```

Conclusion:

- The frontend reads `payload.message` first.
- This matches the backend Ground Truth that errors use `message` for the relevant auth/profile/feedback routes.
- The code still includes fallback logic for `error`, which is not part of the strict backend contract but is not necessarily harmful.

---

## 8) domain/types.ts current state

File:

- frontend/src/domain/types.ts

Observed code:

```ts
export type Role = "user" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  favoriteCategories: string[];
  favoriteFandoms: string[];
  bio: string;
  suspended: boolean;
  avatar?: string;
  verified?: boolean;
}
```

Conclusion:

- Role is correct.
- User type still contains local/demo fields and is not yet aligned with backend contract fields such as:
  - status
  - favorite_fandoms
  - display_preferences

---

## 9) Captcha state

Observed code:

- frontend/src/pages/Auth.tsx
- frontend/src/features/auth/api.ts

The current code tries to pass `captcha_token`, but the form is not clearly collecting a real captcha value, and the register flow is sending extra `favoriteCategories` instead of the exact required contract.

Conclusion:

- Captcha is not implemented as a real integrated flow in the code reviewed.
- The frontend does not show a verified real captcha integration in the current auth form.
- This remains a mismatch with the backend Ground Truth.

---

## Overall assessment

### What is already aligned

- Shared client uses `/api` and token storage in `localStorage`.
- Refresh token rotation logic exists in the shared HTTP client.
- Auth endpoints are structurally arranged around `/auth/*`.
- Feedback field names `type` and `content` are correct.

### What is still mismatched

- Auth register/login payloads do not match the exact Ground Truth payloads.
- Profile uses `/auth/me` and `/auth/profile` instead of `/users/me` and `PUT /users/me`.
- The user model is not yet aligned with backend `favorite_fandoms` / `display_preferences` / `status` fields.
- Captcha is not fully integrated in a backend-safe way.
- Feedback UI still contains demo wording and local-only behavior in the current code.

---

## Final note

This report is based on direct reading of the frontend code at the time of review. It is not a backend scan and it intentionally does not invent endpoint contracts not confirmed by the frontend code or the given Ground Truth.
