import assert from "node:assert/strict";
import test from "node:test";
import { csrfProtection, issueCsrfToken } from "./csrf";
import { env } from "../config/env";

function responseMock() {
  let statusCode = 200;
  const headers: Record<string, string> = {};
  return {
    get statusCode() {
      return statusCode;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      return { statusCode, body };
    },
    cookie(_name: string, value: string) {
      headers["set-cookie"] = value;
    },
    headers,
  };
}

function request(cookie?: string, header?: string, origin = env.corsOrigin) {
  return {
    method: "POST",
    headers: { cookie, origin },
    get(name: string) {
      return name === "X-CSRF-Token" ? header : name === "Origin" ? origin : undefined;
    },
  } as never;
}

test("CSRF rejects a missing token", () => {
  const response = responseMock();
  let called = false;
  csrfProtection(request(), response as never, () => { called = true; });
  assert.equal(called, false);
  assert.equal(response.statusCode, 403);
});

test("CSRF rejects an invalid token", () => {
  const response = responseMock();
  csrfProtection(request(`${env.csrfCookieName}=a`, "a"), response as never, () => {});
  assert.equal(response.statusCode, 403);
});

test("CSRF accepts matching tokens", () => {
  const response = responseMock();
  let called = false;
  const token = "a".repeat(64);
  csrfProtection(request(`${env.csrfCookieName}=${token}`, token), response as never, () => { called = true; });
  assert.equal(called, true);
});

test("CSRF rejects a foreign origin", () => {
  const response = responseMock();
  csrfProtection(request(`${env.csrfCookieName}=${"a".repeat(64)}`, "a".repeat(64), "https://evil.example"), response as never, () => {});
  assert.equal(response.statusCode, 403);
});

test("CSRF endpoint issues a token cookie and response", () => {
  const response = responseMock();
  issueCsrfToken({} as never, response as never);
  assert.match(response.headers["set-cookie"], /^[a-f0-9]{64}$/);
});
