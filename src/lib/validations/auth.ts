import { z } from 'zod';

const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?' as const;

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((p) => /[A-Z]/.test(p), {
    message: 'Password must contain an uppercase letter',
  })
  .refine((p) => /[a-z]/.test(p), {
    message: 'Password must contain a lowercase letter',
  })
  .refine((p) => /[0-9]/.test(p), {
    message: 'Password must contain a number',
  })
  .refine((p) => [...SPECIAL_CHARS].some((c) => p.includes(c)), {
    message: 'Password must contain a special character',
  });

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .toLowerCase()
  .pipe(z.email({ message: 'Enter a valid email address' }));

export const signupFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirm your password'),
  displayName: z
    .string()
    .trim()
    .max(120, 'Display name is too long')
    .optional(),
});

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export function parseSignupForm(formData: FormData) {
  const dn = formData.get('displayName');
  const displayNameRaw =
    typeof dn === 'string' && dn.trim().length > 0 ? dn.trim() : undefined;
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    displayName: displayNameRaw,
  };
  const parsed = signupFormSchema.safeParse({
    email: raw.email,
    password: raw.password,
    confirmPassword: raw.confirmPassword,
    displayName: raw.displayName,
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { ok: false as const, error: 'Passwords do not match' };
  }
  return {
    ok: true as const,
    data: {
      email: parsed.data.email,
      password: parsed.data.password,
      displayName: parsed.data.displayName || null,
    },
  };
}

export function parseLoginForm(formData: FormData) {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  };
  const parsed = loginFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }
  return { ok: true as const, data: parsed.data };
}
