"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, MONO } from "../components/theme";
import { Tape, PerfLine, DashRule, MetaLine, Barcode } from "../components/paper";

/**
 * The head of the roll. Same stock, same rules and tracked-out caps as the
 * ledger behind it, so signing in reads as the first thing printed rather than
 * a login screen bolted onto the front.
 */
export default function SignInForm({ callbackFailed }: { callbackFailed: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      // On success the browser leaves for Google, so nothing after this runs.
      if (oauthError) throw oauthError;
    } catch (err) {
      console.error("Sign-in failed:", err);
      setError(err instanceof Error ? err.message : "Could not reach the sign-in service");
      setPending(false);
    }
  }

  return (
    <div
      style={{
        fontFamily: MONO,
        minHeight: "100vh",
        padding: "44px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <Tape padding="26px 26px 22px">
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                margin: 0,
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: "0.02em",
                color: T.ink,
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              Receiptly
            </h1>
            <div style={{ marginTop: 10 }}>
              <MetaLine size={10} color={T.muted} align="center">
                Your Digital Receipt Vault
              </MetaLine>
            </div>
          </div>

          <DashRule margin="18px 0 12px" />

          <MetaLine size={9} color={T.faint} align="center">
            REG 01 · LANE 03 · SIGN IN REQUIRED
          </MetaLine>

          <div style={{ marginTop: 22 }}>
            <button
              className="paper-btn"
              onClick={signIn}
              disabled={pending}
              style={{
                width: "100%",
                background: "transparent",
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: T.ink,
                color: T.ink,
                borderRadius: 0,
                padding: "15px 20px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: pending ? "wait" : "pointer",
                fontFamily: MONO,
                minHeight: 50,
                opacity: pending ? 0.55 : 1,
              }}
            >
              {pending ? "Connecting…" : "Continue with Google"}
            </button>
          </div>

          {(error || callbackFailed) && (
            <div style={{ marginTop: 14 }} role="alert">
              <MetaLine size={9} color="oklch(45% 0.15 25)" align="center">
                {error ?? "Sign-in did not complete · please try again"}
              </MetaLine>
            </div>
          )}

          <div style={{ marginTop: 22 }}>
            <MetaLine size={9} color={T.faint} align="center">
              Google is the only way in · no password is stored
            </MetaLine>
          </div>

          <PerfLine margin="20px 0 14px" label="AUTHORISED ACCESS ONLY" />

          <Barcode value="receiptly-signin" height={26} count={38} caption="RECEIPTLY POS v1.0" />
        </Tape>
      </div>
    </div>
  );
}
