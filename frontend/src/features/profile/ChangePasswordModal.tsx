import React, { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "../../domain/types";
import { useApp } from "../../lib/store";
import { useAuth } from "../auth/AuthProvider";
import { Button, Field, Modal } from "../../components/ui";
import { navigate } from "../../lib/router";
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

export default function ChangePasswordModal({
  open,
  user,
  onClose,
}: {
  open: boolean;
  user: User;
  onClose: () => void;
}) {
  const { notify } = useApp();
  const { login, logout } = useAuth();
  const mounted = useRef(false);
  const busyRef = useRef(false);
  const currentPasswordRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (!open) {
      setFields(emptyFields);
      setVisible({
        current_password: false,
        new_password: false,
        confirm_password: false,
      });
      setError("");
      return;
    }

    setFields(emptyFields);
    setError("");
    const frame = requestAnimationFrame(() =>
      currentPasswordRef.current?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const update = (key: keyof PasswordFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const toggleVisibility = (key: keyof PasswordFields) => {
    setVisible((current) => ({ ...current, [key]: !current[key] }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busyRef.current) return;

    if (Object.values(fields).some((value) => value === "")) {
      setError("Please complete all password fields.");
      return;
    }
    if (fields.new_password === fields.current_password) {
      setError("The new password must be different from the current password.");
      return;
    }
    if (fields.new_password !== fields.confirm_password) {
      setError("Password confirmation does not match.");
      return;
    }
    const passwordError = validateNewPassword(fields.new_password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await profileApi.changePassword({
        current_password: fields.current_password,
        new_password: fields.new_password,
      });
      const newPassword = fields.new_password;
      setFields(emptyFields);
      onClose();
      try {
        await login(user.email, newPassword);
        notify("Password changed successfully.");
      } catch {
        try {
          await logout();
        } catch {
          clearTokens();
        }
        navigate("/login");
      }
    } catch (cause) {
      if (mounted.current) {
        setError(
          cause instanceof Error ? cause.message : "Could not change password.",
        );
      }
    } finally {
      busyRef.current = false;
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
          ? "At least 8 characters, including an uppercase letter, lowercase letter, number, and special character."
          : undefined
      }
    >
      <div className="password-field">
        <input
          ref={key === "current_password" ? currentPasswordRef : undefined}
          type={visible[key] ? "text" : "password"}
          autoComplete={autoComplete}
          value={fields[key]}
          onChange={(event) => update(key, event.target.value)}
          disabled={busy}
        />
        <button
          type="button"
          aria-pressed={visible[key]}
          aria-label={`${visible[key] ? "Hide" : "Show"} ${label.toLowerCase()}`}
          onClick={() => toggleVisibility(key)}
          disabled={busy}
        >
          {visible[key] ? "Hide" : "Show"}
        </button>
      </div>
    </Field>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change password"
      closeDisabled={busy}
      closeLabel="Close dialog"
    >
      <div className="profile-password-modal">
        <div className="profile-password-account">
          <strong>Account information</strong>
          <span>{user.name}</span>
          <input
            type="email"
            value={user.email}
            autoComplete="username"
            aria-label="Account email"
            readOnly
          />
        </div>
        <form className="stack-form" onSubmit={submit}>
          {passwordField(
            "current_password",
            "Current password",
            "current-password",
          )}
          {passwordField("new_password", "New password", "new-password")}
          {passwordField(
            "confirm_password",
            "Confirm new password",
            "new-password",
          )}
          {error && (
            <div className="profile-password-error" role="alert">
              {error}
            </div>
          )}
          <div className="profile-password-actions">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" busy={busy} disabled={busy}>
              Confirm
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
