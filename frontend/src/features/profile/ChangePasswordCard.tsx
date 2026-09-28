import React, { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "../../domain/types";
import { useApp } from "../../lib/store";
import { useAuth } from "../auth/AuthProvider";
import { Button, Field } from "../../components/ui";
import { navigate, Link } from "../../lib/router";
import { clearTokens } from "../../shared/http/client";
import { profileApi } from "./api";
import { validateNewPassword } from "./validation";

type PasswordFields = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

type Visibility = Record<keyof PasswordFields, boolean>;

const emptyFields: PasswordFields = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

export default function ChangePasswordCard({ user }: { user: User }) {
  const { notify } = useApp();
  const { logout } = useAuth();
  const mounted = useRef(false);
  const [fields, setFields] = useState(emptyFields);
  const [visible, setVisible] = useState<Visibility>({
    current_password: false,
    new_password: false,
    confirm_password: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const update = (key: keyof PasswordFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const toggleVisibility = (key: keyof PasswordFields) => {
    setVisible((current) => ({ ...current, [key]: !current[key] }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    if (Object.values(fields).some((value) => value === "")) {
      setError("Vui lòng nhập đầy đủ các trường mật khẩu.");
      return;
    }
    if (fields.new_password === fields.current_password) {
      setError("Mật khẩu mới không được trùng mật khẩu cũ");
      return;
    }
    if (fields.new_password !== fields.confirm_password) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    const passwordError = validateNewPassword(fields.new_password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setBusy(true);
    setError("");
    try {
      await profileApi.changePassword({
        current_password: fields.current_password,
        new_password: fields.new_password,
      });
      if (mounted.current) setFields(emptyFields);
      notify("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      try {
        await logout();
      } catch {
        clearTokens();
      }
      navigate("/login");
    } catch (cause) {
      if (mounted.current) {
        setError(
          cause instanceof Error ? cause.message : "Không thể đổi mật khẩu.",
        );
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const passwordField = (
    key: keyof PasswordFields,
    label: string,
    autoComplete: "current-password" | "new-password",
  ) => (
    <Field
      label={label}
      hint={
        key === "new_password"
          ? "Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt."
          : undefined
      }
    >
      <div className="password-field">
        <input
          type={visible[key] ? "text" : "password"}
          autoComplete={autoComplete}
          value={fields[key]}
          onChange={(event) => update(key, event.target.value)}
          disabled={busy}
        />
        <button
          className="password-toggle"
          type="button"
          aria-pressed={visible[key]}
          aria-label={`${visible[key] ? "Ẩn" : "Hiện"} ${label.toLowerCase()}`}
          onClick={() => toggleVisibility(key)}
        >
          {visible[key] ? "Ẩn" : "Hiện"}
        </button>
      </div>
    </Field>
  );

  return (
    <section className="panel password-card">
      <h2>Đổi mật khẩu</h2>
      <div className="password-account-info">
        <strong>Thông tin tài khoản</strong>
        <span>{user.name}</span>
        <input
          type="email"
          value={user.email}
          autoComplete="username"
          aria-label="Email tài khoản"
          readOnly
        />
      </div>
      <form className="stack-form" onSubmit={submit}>
        {passwordField(
          "current_password",
          "Mật khẩu hiện tại",
          "current-password",
        )}
        {passwordField("new_password", "Mật khẩu mới", "new-password")}
        {passwordField(
          "confirm_password",
          "Xác nhận mật khẩu mới",
          "new-password",
        )}
        {error && (
          <div className="password-error" role="alert">
            {error}
          </div>
        )}
        <Button type="submit" busy={busy} disabled={busy}>
          Đổi mật khẩu
        </Button>
        <Link className="text-link" to="/forgot-password">
          Quên mật khẩu?
        </Link>
      </form>
    </section>
  );
}
