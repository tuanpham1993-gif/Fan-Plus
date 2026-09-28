import React from "react";
import type { User } from "../../domain/types";
import { Field } from "../../components/ui";

export type PersonalInfoValues = {
  phone: string;
  birthday: string;
  gender: string;
  city: string;
  bio: string;
};

export type PersonalInfoErrors = Partial<
  Record<keyof PersonalInfoValues, string>
>;

function formatCreatedAt(value: string) {
  const createdAt = new Date(value);
  return Number.isNaN(createdAt.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(createdAt);
}

function todayInputValue() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function PersonalInfoFields({
  user,
  values,
  errors,
  onChange,
}: {
  user: User;
  values: PersonalInfoValues;
  errors: PersonalInfoErrors;
  onChange: (field: keyof PersonalInfoValues, value: string) => void;
}) {
  return (
    <fieldset className="profile-personal-info">
      <legend>Personal information</legend>
      <dl className="profile-readonly-row">
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Account created</dt>
          <dd>{formatCreatedAt(user.created_at)}</dd>
        </div>
      </dl>
      <div className="profile-fields">
        <Field label="Phone number" hint={errors.phone || "Optional."}>
          <input
            type="tel"
            autoComplete="tel"
            maxLength={20}
            value={values.phone}
            aria-invalid={Boolean(errors.phone)}
            onChange={(event) => onChange("phone", event.target.value)}
          />
        </Field>
        <Field label="Date of birth" hint={errors.birthday || undefined}>
          <input
            type="date"
            max={todayInputValue()}
            value={values.birthday}
            aria-invalid={Boolean(errors.birthday)}
            onChange={(event) => onChange("birthday", event.target.value)}
          />
        </Field>
        <Field label="Gender" hint={errors.gender || undefined}>
          <select
            value={values.gender}
            aria-invalid={Boolean(errors.gender)}
            onChange={(event) => onChange("gender", event.target.value)}
          >
            <option value="">Not selected</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="undisclosed">Prefer not to say</option>
          </select>
        </Field>
        <Field label="City" hint={errors.city || undefined}>
          <input
            maxLength={100}
            value={values.city}
            aria-invalid={Boolean(errors.city)}
            onChange={(event) => onChange("city", event.target.value)}
          />
        </Field>
        <div className="profile-field-full">
          <Field label="About me" hint={errors.bio || undefined}>
            <textarea
              rows={4}
              maxLength={300}
              value={values.bio}
              aria-invalid={Boolean(errors.bio)}
              onChange={(event) => onChange("bio", event.target.value)}
            />
          </Field>
        </div>
        <span
          className="field-counter muted profile-field-full"
          aria-live="polite"
        >
          {values.bio.length}/300
        </span>
      </div>
    </fieldset>
  );
}
