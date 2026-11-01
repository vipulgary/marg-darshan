/**
 * Account-linking decisions (pure, unit-tested). A Client row is created by the first booking,
 * kundali or enquiry made with an email; an account "claims" it — and everything attached to it —
 * only once that email is proven (verification link, reset link or Google's email_verified).
 */
export interface ClientAuthState {
  id: string;
  emailVerifiedAt: Date | null;
  passwordHash: string | null;
  googleSub: string | null;
}

export type SignupDecision =
  | { kind: "create" }
  // Unverified row (guest booking/kundali or an abandoned signup): (re)set the password, prove the email.
  | { kind: "set_password_and_verify"; clientId: string }
  // Already a real account: leave it alone and tell the owner by email.
  | { kind: "notify_existing"; clientId: string };

export function decideSignup(existing: ClientAuthState | null): SignupDecision {
  if (!existing) return { kind: "create" };
  if (existing.emailVerifiedAt) return { kind: "notify_existing", clientId: existing.id };
  return { kind: "set_password_and_verify", clientId: existing.id };
}

export type GoogleDecision =
  | { kind: "login"; clientId: string }
  | { kind: "link"; clientId: string; dropPassword: boolean }
  | { kind: "create" }
  | { kind: "reject"; reason: "email_unverified" | "linked_elsewhere" };

export function decideGoogle(
  identity: { sub: string; emailVerified: boolean },
  bySub: ClientAuthState | null,
  byEmail: ClientAuthState | null,
): GoogleDecision {
  if (bySub) return { kind: "login", clientId: bySub.id };
  if (!identity.emailVerified) return { kind: "reject", reason: "email_unverified" };
  if (!byEmail) return { kind: "create" };
  if (byEmail.googleSub && byEmail.googleSub !== identity.sub) return { kind: "reject", reason: "linked_elsewhere" };
  // A password set on a never-verified row may have been typed by someone else; drop it.
  return { kind: "link", clientId: byEmail.id, dropPassword: !byEmail.emailVerifiedAt && Boolean(byEmail.passwordHash) };
}

/** Password login is allowed only for verified accounts that have a password. */
export function loginOutcome(client: ClientAuthState | null, passwordOk: boolean): "ok" | "invalid" | "unverified" {
  if (!client || !client.passwordHash || !passwordOk) return "invalid";
  return client.emailVerifiedAt ? "ok" : "unverified";
}
