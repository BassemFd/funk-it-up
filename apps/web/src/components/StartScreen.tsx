import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { REGISTER_PLAYER, LOGIN_PLAYER } from "../api/queries";
import { getStoredAuth, setStoredAuth, clearStoredAuth } from "../api/auth";
import { Track } from "../tracks";

interface Props {
  onStart: () => void;
  musicReady: boolean;
  tracks: Track[];
  selectedTrackId: string;
  onSelectTrack: (id: string) => void;
}

type AuthMode = "register" | "login";

interface AuthPayload {
  playerId: string;
  displayName: string;
  token: string;
}

interface RegisterData {
  registerPlayer: AuthPayload;
}

interface LoginData {
  loginPlayer: AuthPayload;
}

function errorCode(err: unknown): string | undefined {
  if (CombinedGraphQLErrors.is(err)) {
    return err.errors[0]?.extensions?.code as string | undefined;
  }
  return undefined;
}

export function StartScreen({ onStart, musicReady, tracks, selectedTrackId, onSelectTrack }: Props) {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [mode, setMode] = useState<AuthMode>("register");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [registerPlayer, { loading: registering }] = useMutation<RegisterData>(REGISTER_PLAYER);
  const [loginPlayer, { loading: loggingIn }] = useMutation<LoginData>(LOGIN_PLAYER);
  const busy = registering || loggingIn;

  const handleSwitchAccount = () => {
    clearStoredAuth();
    setAuth(null);
    setName("");
    setPassword("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === "register") {
        const { data } = await registerPlayer({ variables: { displayName: name, password } });
        const payload = data?.registerPlayer;
        if (payload) {
          setStoredAuth(payload);
          setAuth(payload);
        }
      } else {
        const { data } = await loginPlayer({ variables: { displayName: name, password } });
        const payload = data?.loginPlayer;
        if (payload) {
          setStoredAuth(payload);
          setAuth(payload);
        }
      }
    } catch (err) {
      const code = errorCode(err);
      if (code === "NAME_TAKEN") {
        setError("Ce nom est déjà pris — connecte-toi si c'est ton compte.");
        setMode("login");
      } else if (code === "INVALID_CREDENTIALS") {
        setError("Nom ou mot de passe incorrect.");
      } else if (code === "INVALID_NAME" || code === "INVALID_PASSWORD") {
        setError((err as Error).message);
      } else {
        setError("Une erreur est survenue. Réessaie.");
      }
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h1 style={styles.title}>FUNK IT UP</h1>
        <p style={styles.sub}>A rhythmic platformer</p>
        <p style={styles.hint}>Jump on the beat · Keep the groove alive</p>

        {auth ? (
          <>
            <p style={styles.welcome}>
              Welcome back, <span style={styles.welcomeName}>{auth.displayName}</span>
            </p>
            <div style={styles.trackList}>
              {tracks.map((t, i) => {
                const selected = t.id === selectedTrackId;
                return (
                  <button
                    key={t.id}
                    style={{ ...styles.trackBtn, ...(selected ? styles.trackBtnSelected : null) }}
                    onClick={() => onSelectTrack(t.id)}
                  >
                    <span style={styles.trackNum}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={styles.trackTitle}>{t.title}</span>
                    <span style={styles.trackBpm}>{Math.round(t.bpm)} BPM</span>
                  </button>
                );
              })}
            </div>
            <button style={styles.btn} onClick={onStart} disabled={!musicReady}>
              {musicReady ? "PRESS TO PLAY" : "LOADING TRACK…"}
            </button>
            <button style={styles.switchLink} onClick={handleSwitchAccount}>
              Not you? Switch account
            </button>
          </>
        ) : (
          <form style={styles.form} onSubmit={handleSubmit}>
            <label style={styles.nameLabel}>
              PLAYER NAME
              <input
                style={styles.nameInput}
                value={name}
                maxLength={16}
                autoFocus
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label style={styles.nameLabel}>
              PASSWORD
              <input
                style={styles.nameInput}
                type="password"
                value={password}
                maxLength={64}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.btn} type="submit" disabled={busy}>
              {busy ? "…" : mode === "register" ? "CREATE ACCOUNT & PLAY" : "LOG IN & PLAY"}
            </button>
            <button
              type="button"
              style={styles.switchLink}
              onClick={() => {
                setMode(mode === "register" ? "login" : "register");
                setError(null);
              }}
            >
              {mode === "register" ? "Already have an account? Log in" : "New here? Create an account"}
            </button>
          </form>
        )}

        <p style={styles.controls}>
          <kbd style={styles.kbd}>SPACE</kbd> or tap to jump
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(26, 5, 51, 0.92)",
    fontFamily: "monospace",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    padding: "48px 64px",
    border: "2px solid #6030a0",
    borderRadius: 12,
    background: "rgba(40, 10, 80, 0.95)",
    minWidth: 320,
  },
  title: {
    fontSize: 56,
    fontWeight: 900,
    color: "#f0e060",
    textShadow: "0 0 24px #f0c040, 0 0 48px #f08000",
    letterSpacing: 8,
  },
  sub: {
    fontSize: 16,
    color: "#e040fb",
    textShadow: "0 0 8px #e040fb",
    letterSpacing: 3,
  },
  hint: {
    fontSize: 13,
    color: "#9060c0",
    letterSpacing: 1,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  welcome: {
    fontSize: 14,
    color: "#c0a0e0",
    marginTop: 8,
  },
  trackList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    width: "100%",
    maxHeight: 220,
    overflowY: "auto",
  },
  trackBtn: {
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    width: "100%",
    padding: "8px 12px",
    fontFamily: "monospace",
    fontSize: 13,
    letterSpacing: 1,
    textAlign: "left",
    background: "#2a0a50",
    border: "2px solid #6030a0",
    borderRadius: 6,
    color: "#c0a0e0",
    cursor: "pointer",
  },
  trackBtnSelected: {
    background: "#3a1060",
    border: "2px solid #e040fb",
    color: "#f0e060",
    boxShadow: "0 0 12px rgba(224, 64, 251, 0.5)",
  },
  trackNum: {
    color: "#9060c0",
    fontSize: 11,
  },
  trackTitle: {
    flex: 1,
  },
  trackBpm: {
    fontSize: 10,
    color: "#9060c0",
  },
  welcomeName: {
    color: "#f0e060",
    fontWeight: "bold",
  },
  nameLabel: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 11,
    color: "#9060c0",
    letterSpacing: 2,
    width: "100%",
  },
  nameInput: {
    fontFamily: "monospace",
    fontSize: 16,
    letterSpacing: 1,
    padding: "10px 12px",
    background: "#2a0a50",
    border: "2px solid #6030a0",
    borderRadius: 6,
    color: "#f0e060",
    outline: "none",
    textAlign: "center",
  },
  error: {
    fontSize: 12,
    color: "#ff6070",
    textAlign: "center",
    margin: 0,
  },
  btn: {
    marginTop: 8,
    padding: "14px 40px",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "monospace",
    letterSpacing: 3,
    background: "#e040fb",
    color: "#1a0533",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    boxShadow: "0 0 24px #e040fb",
    transition: "transform 0.1s",
  },
  switchLink: {
    background: "none",
    border: "none",
    color: "#9060c0",
    fontSize: 11,
    letterSpacing: 1,
    textDecoration: "underline",
    cursor: "pointer",
    fontFamily: "monospace",
    padding: 0,
  },
  controls: {
    fontSize: 12,
    color: "#6030a0",
    marginTop: 8,
  },
  kbd: {
    background: "#3a1060",
    border: "1px solid #6030a0",
    borderRadius: 4,
    padding: "2px 8px",
    color: "#e040fb",
  },
};
