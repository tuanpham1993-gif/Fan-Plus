import React, { useEffect, useState, type FormEvent } from "react";
import type { User } from "../../domain/types";
import { useApp } from "../../lib/store";
import { Button, Field } from "../../components/ui";
import { profileApi } from "./api";
import {
  validateBirthday,
  validateBio,
  validateCity,
  validatePhone,
} from "./validation";

type PersonalInfo = {
  phone: string;
  birthday: string;
  gender: string;
  city: string;
  bio: string;
};

type PersonalInfoKey = keyof PersonalInfo;
type PersonalInfoErrors = Partial<Record<PersonalInfoKey, string>>;

function fromUser(user: User): PersonalInfo {
  return {
    phone: user.phone ?? "",
    birthday: user.birthday?.slice(0, 10) ?? "",
    gender: user.gender ?? "",
    city: user.city ?? "",
    bio: user.bio ?? "",
  };
}

function todayInputValue() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatCreatedAt(value: string) {
  const createdAt = new Date(value);
  return Number.isNaN(createdAt.getTime())
    ? "Không rõ"
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(createdAt);
}

export default function PersonalInfoCard({
  user,
  onSaved,
}: {
  user: User;
  onSaved: (user: User) => void;
}) {
  const { notify } = useApp();
  const [values, setValues] = useState(() => fromUser(user));
  const [errors, setErrors] = useState<PersonalInfoErrors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValues(fromUser(user));
    setErrors({});
  }, [user.id, user.phone, user.birthday, user.gender, user.city, user.bio]);

  const savedValues = fromUser(user);
  const changed = (Object.keys(savedValues) as PersonalInfoKey[]).some(
    (key) => values[key] !== savedValues[key],
  );
  const today = todayInputValue();

  const update = (key: PersonalInfoKey, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const nextErrors: PersonalInfoErrors = {
      phone: validatePhone(values.phone),
      birthday: validateBirthday(values.birthday),
      gender:
        values.gender &&
        !["male", "female", "other", "undisclosed"].includes(values.gender)
          ? "Giới tính không hợp lệ"
          : "",
      city: validateCity(values.city),
      bio: validateBio(values.bio),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setBusy(true);
    try {
      const updatedUser = await profileApi.updatePersonalInfo({
        phone: values.phone.trim() || null,
        birthday: values.birthday || null,
        gender: values.gender || null,
        city: values.city.trim() || null,
        bio: values.bio.trim() || null,
      });
      onSaved(updatedUser);
      notify("Đã lưu thông tin cá nhân.");
    } catch (cause) {
      notify(
        cause instanceof Error
          ? cause.message
          : "Không thể lưu thông tin cá nhân.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel personal-info-card">
      <h2>Thông tin cá nhân</h2>
      <div className="personal-account-meta">
        <p>
          <strong>Email</strong>
          <span>{user.email}</span>
        </p>
        <p>
          <strong>Ngày tạo tài khoản</strong>
          <span>{formatCreatedAt(user.created_at)}</span>
        </p>
      </div>
      <form className="stack-form" onSubmit={submit}>
        <Field label="Số điện thoại" hint={errors.phone || "Có thể để trống."}>
          <input
            type="tel"
            autoComplete="tel"
            maxLength={20}
            value={values.phone}
            aria-invalid={Boolean(errors.phone)}
            onChange={(event) => update("phone", event.target.value)}
          />
        </Field>
        <Field label="Ngày sinh" hint={errors.birthday || undefined}>
          <input
            type="date"
            max={today}
            value={values.birthday}
            aria-invalid={Boolean(errors.birthday)}
            onChange={(event) => update("birthday", event.target.value)}
          />
        </Field>
        <Field label="Giới tính" hint={errors.gender || undefined}>
          <select
            value={values.gender}
            aria-invalid={Boolean(errors.gender)}
            onChange={(event) => update("gender", event.target.value)}
          >
            <option value="">Chưa chọn</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
            <option value="undisclosed">Không muốn nói</option>
          </select>
        </Field>
        <Field label="Thành phố" hint={errors.city || undefined}>
          <input
            maxLength={100}
            value={values.city}
            aria-invalid={Boolean(errors.city)}
            onChange={(event) => update("city", event.target.value)}
          />
        </Field>
        <Field label="Giới thiệu bản thân" hint={errors.bio || undefined}>
          <textarea
            rows={4}
            maxLength={300}
            value={values.bio}
            aria-invalid={Boolean(errors.bio)}
            onChange={(event) => update("bio", event.target.value)}
          />
        </Field>
        <div className="field-counter muted" aria-live="polite">
          {values.bio.length}/300
        </div>
        <Button type="submit" busy={busy} disabled={!changed || busy}>
          Lưu thông tin cá nhân
        </Button>
      </form>
    </section>
  );
}
