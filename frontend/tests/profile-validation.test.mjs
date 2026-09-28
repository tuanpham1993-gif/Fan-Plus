import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/features/profile/validation.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const validation = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("phone validation matches the profile phone contract", () => {
  assert.equal(validation.validatePhone("+84 (987) 654-321"), "");
  assert.equal(validation.validatePhone(""), "");
  assert.match(validation.validatePhone("1234567x"), /chỉ được chứa/);
  assert.match(validation.validatePhone("1234567"), /ít nhất 8 chữ số/);
  assert.match(validation.validatePhone("123456789012345678901"), /8 đến 20/);
});

test("birthday validation rejects impossible, future and over-age dates", () => {
  assert.equal(validation.validateBirthday("1990-02-03"), "");
  assert.match(validation.validateBirthday("1990-02-30"), /định dạng/);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const future = [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, "0"),
    String(tomorrow.getDate()).padStart(2, "0"),
  ].join("-");
  assert.match(validation.validateBirthday(future), /tương lai/);
  assert.match(validation.validateBirthday("1900-01-01"), /120/);
});

test("city and bio validation enforce character limits", () => {
  assert.equal(validation.validateCity("Hanoi"), "");
  assert.match(validation.validateCity("c".repeat(101)), /100 ký tự/);
  assert.equal(validation.validateBio("A short bio."), "");
  assert.match(validation.validateBio("b".repeat(301)), /300 ký tự/);
});

test("new passwords require each backend complexity rule", () => {
  assert.match(validation.validateNewPassword("short"), /ít nhất 8 ký tự/);
  assert.match(validation.validateNewPassword("password1!"), /viết hoa/);
  assert.match(validation.validateNewPassword("PASSWORD1!"), /viết thường/);
  assert.match(validation.validateNewPassword("Password!"), /chữ số/);
  assert.match(validation.validateNewPassword("Password1"), /ký tự đặc biệt/);
  assert.equal(validation.validateNewPassword("Password1!"), "");
});

test("password validation does not trim or mutate input whitespace", () => {
  const password = " Password1! ";
  assert.equal(validation.validateNewPassword(password), "");
  assert.equal(password, " Password1! ");
});
