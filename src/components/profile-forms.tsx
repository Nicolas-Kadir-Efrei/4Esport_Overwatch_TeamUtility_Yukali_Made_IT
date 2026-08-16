"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  saveAvailability,
  updateProfile,
  uploadAvatar,
  type ProfileActionState,
} from "@/lib/actions/profile";
import { DAY_LABELS, PLAYER_ROLES } from "@/lib/constants";
import {
  SOCIAL_PLATFORMS,
  type SocialPlatformId,
  normalizeSocialPlatformId,
} from "@/lib/social-platforms";
import { Avatar } from "@/components/avatar";
import { SocialPlatformIcon, SocialLinkChip } from "@/components/social-icons";

const initial: ProfileActionState = {};

type Slot = { dayOfWeek: number; startTime: string; endTime: string };

function Feedback({ state }: { state: ProfileActionState }) {
  if (state.error) return <p className="alert alert-error">{state.error}</p>;
  if (state.success) return <p className="alert alert-ok">{state.success}</p>;
  return null;
}

export function ProfileForm({
  displayName,
  battleTag,
  discord,
  smurfTags,
  playerRoles,
  links,
}: {
  displayName: string;
  battleTag?: string | null;
  discord?: string | null;
  smurfTags: string[];
  playerRoles: string[];
  links: { label: string; url: string }[];
}) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  const [smurfs, setSmurfs] = useState<string[]>(smurfTags);
  const [draftSmurf, setDraftSmurf] = useState("");
  const [roles, setRoles] = useState<string[]>(playerRoles);
  const [userLinks, setUserLinks] = useState(() =>
    links.map((l) => ({
      label: normalizeSocialPlatformId(l.label),
      url: l.url,
    })),
  );
  const [linkPlatform, setLinkPlatform] = useState<SocialPlatformId>("twitch");
  const [linkUrl, setLinkUrl] = useState("");

  const usedPlatforms = useMemo(
    () => new Set(userLinks.map((l) => l.label)),
    [userLinks],
  );

  const selectedPlatform = SOCIAL_PLATFORMS.find((p) => p.id === linkPlatform)!;

  function addSmurf() {
    const tag = draftSmurf.trim();
    if (!tag || smurfs.includes(tag) || smurfs.length >= 8) return;
    setSmurfs((prev) => [...prev, tag]);
    setDraftSmurf("");
  }

  function addLink() {
    const url = linkUrl.trim();
    if (!url || !/^https?:\/\//i.test(url) || userLinks.length >= 10) {
      return;
    }
    setUserLinks((prev) => {
      const without = prev.filter((l) => l.label !== linkPlatform);
      return [...without, { label: linkPlatform, url }];
    });
    setLinkUrl("");
  }

  function toggleRole(value: string) {
    setRoles((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value],
    );
  }

  const roleGroups = [
    { name: "Tank", values: ["TANK"] },
    { name: "DPS", values: ["DPS_HITSCAN", "DPS_FLEX"] },
    { name: "Healer", values: ["SUPPORT_MAIN", "SUPPORT_OFF"] },
  ] as const;

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="displayName">
            Pseudo
          </label>
          <input
            className="input"
            id="displayName"
            name="displayName"
            defaultValue={displayName}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="battleTag">
            BattleTag principal
          </label>
          <input
            className="input"
            id="battleTag"
            name="battleTag"
            defaultValue={battleTag ?? ""}
            placeholder="Pseudo#1234"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="discord">
            Discord
          </label>
          <input
            className="input"
            id="discord"
            name="discord"
            defaultValue={discord ?? ""}
            placeholder="pseudo ou https://discord.gg/…"
          />
          <p className="field-hint">Visible par ton équipe sur la page roster.</p>
        </div>
      </div>

      <div>
        <p className="label">Liens perso</p>
        <p className="field-hint mb-3">
          Choisis une plateforme, colle ton lien, puis ajoute.
        </p>
        <div className="platform-grid" role="listbox" aria-label="Plateforme">
          {SOCIAL_PLATFORMS.map((p) => {
            const used = usedPlatforms.has(p.id);
            const active = linkPlatform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={active}
                className={`platform-pick${active ? " is-active" : ""}${used ? " is-used" : ""}`}
                onClick={() => setLinkPlatform(p.id)}
                title={used ? `${p.label} (déjà ajouté — remplacera l’URL)` : p.label}
              >
                <SocialPlatformIcon platform={p.id} className="h-4 w-4" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            className="input"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder={selectedPlatform.placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
          />
          <button className="btn btn-ghost text-sm" type="button" onClick={addLink}>
            Ajouter
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {userLinks.length === 0 && (
            <span className="text-sm text-[var(--muted)]">Aucun lien.</span>
          )}
          {userLinks.map((l) => (
            <SocialLinkChip
              key={l.label}
              platform={l.label}
              url={l.url}
              onRemove={() =>
                setUserLinks((prev) => prev.filter((x) => x.label !== l.label))
              }
            />
          ))}
        </div>
        <input type="hidden" name="links" value={JSON.stringify(userLinks)} />
      </div>

      <div>
        <p className="label">BattleTags smurf</p>
        <div className="flex flex-wrap gap-2">
          <input
            className="input max-w-xs"
            value={draftSmurf}
            onChange={(e) => setDraftSmurf(e.target.value)}
            placeholder="Smurf#5678"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSmurf();
              }
            }}
          />
          <button className="btn btn-ghost text-sm" type="button" onClick={addSmurf}>
            Ajouter
          </button>
        </div>
        <p className="field-hint">Jusqu’à 8 comptes smurf.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {smurfs.length === 0 && (
            <span className="text-sm text-[var(--muted)]">Aucun smurf ajouté.</span>
          )}
          {smurfs.map((tag) => (
            <button
              key={tag}
              type="button"
              className="chip avail-maybe"
              onClick={() => setSmurfs((prev) => prev.filter((t) => t !== tag))}
              title="Retirer"
            >
              {tag} ×
            </button>
          ))}
        </div>
        <input type="hidden" name="smurfTags" value={JSON.stringify(smurfs)} />
      </div>

      <div>
        <p className="label">Rôles joués</p>
        <p className="field-hint mb-3">
          Tu peux en sélectionner plusieurs (ex. Tank + Healer Off).
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {roleGroups.map((group) => (
            <div key={group.name} className="schedule-day">
              <p className="mb-2 text-sm font-semibold text-[var(--accent)]">
                {group.name}
              </p>
              <div className="flex flex-col gap-2">
                {PLAYER_ROLES.filter((r) =>
                  (group.values as readonly string[]).includes(r.value),
                ).map((role) => {
                  const active = roles.includes(role.value);
                  return (
                    <label
                      key={role.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                        active
                          ? "border-[var(--line-strong)] bg-[rgba(250,156,30,0.12)]"
                          : "border-[var(--line)] bg-black/20"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="playerRoles"
                        value={role.value}
                        checked={active}
                        onChange={() => toggleRole(role.value)}
                        className="accent-[var(--accent)]"
                      />
                      {role.label}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Feedback state={state} />
      <button className="btn btn-primary" disabled={pending} type="submit">
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}

export function AvatarForm({
  avatarUrl,
  displayName,
}: {
  avatarUrl?: string | null;
  displayName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [state, action, pending] = useActionState(uploadAvatar, initial);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    if (inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
    }
  }

  return (
    <form action={action} className="space-y-4">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar
          src={preview ?? avatarUrl}
          name={displayName}
          size="xl"
        />
        <div className="flex-1 space-y-3">
          <label
            className="dropzone"
            data-active={dragOver ? "true" : "false"}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              pickFile(e.dataTransfer.files?.[0]);
            }}
          >
            <input
              ref={inputRef}
              className="sr-only"
              id="avatar"
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,.gif,.png,.jpg,.jpeg,.webp"
              required
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <p className="font-display text-xl text-[var(--accent)]">
              Dépose ton image ici
            </p>
            <p className="text-sm text-[var(--muted)]">
              PNG, JPG, WebP ou GIF · max 2 Mo
            </p>
            {fileName ? (
              <p className="chip avail-maybe">{fileName}</p>
            ) : (
              <span className="btn btn-ghost text-xs">Choisir un fichier</span>
            )}
          </label>
          <p className="field-hint">
            Les GIF animés sont supportés. La nouvelle photo remplace
            automatiquement l&apos;ancienne.
          </p>
        </div>
      </div>
      <Feedback state={state} />
      <button className="btn btn-primary" disabled={pending} type="submit">
        {pending ? "Upload en cours..." : "Mettre à jour la PFP"}
      </button>
    </form>
  );
}

export function AvailabilityEditor({ initialSlots }: { initialSlots: Slot[] }) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [day, setDay] = useState(1);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("22:00");
  const [state, action, pending] = useActionState(saveAvailability, initial);

  const grouped = useMemo(() => {
    const map = new Map<number, Slot[]>();
    for (const d of DAY_LABELS.keys()) map.set(d, []);
    for (const s of slots) map.get(s.dayOfWeek)?.push(s);
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [slots]);

  function addSlot() {
    if (startTime >= endTime) return;
    setSlots((prev) => {
      const exists = prev.some(
        (s) =>
          s.dayOfWeek === day &&
          s.startTime === startTime &&
          s.endTime === endTime,
      );
      if (exists) return prev;
      return [...prev, { dayOfWeek: day, startTime, endTime }];
    });
  }

  function removeSlot(slot: Slot) {
    setSlots((prev) =>
      prev.filter(
        (s) =>
          !(
            s.dayOfWeek === slot.dayOfWeek &&
            s.startTime === slot.startTime &&
            s.endTime === slot.endTime
          ),
      ),
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="label" htmlFor="day">
            Jour
          </label>
          <select
            className="input"
            id="day"
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
          >
            {DAY_LABELS.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="start">
            Début
          </label>
          <input
            className="input"
            id="start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="end">
            Fin
          </label>
          <input
            className="input"
            id="end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button className="btn btn-ghost w-full" type="button" onClick={addSlot}>
            Ajouter le créneau
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <div key={d} className="schedule-day">
            <p className="mb-2 text-sm font-semibold text-[var(--accent)]">
              {DAY_LABELS[d]}
            </p>
            <div className="flex flex-wrap gap-2">
              {(grouped.get(d) ?? []).length === 0 && (
                <span className="text-xs text-[var(--muted)]">Aucun créneau</span>
              )}
              {(grouped.get(d) ?? []).map((s) => (
                <button
                  key={`${s.dayOfWeek}-${s.startTime}-${s.endTime}`}
                  type="button"
                  className="avail-yes px-2.5 py-1 text-xs"
                  onClick={() => removeSlot(s)}
                  title="Cliquer pour retirer"
                >
                  {s.startTime}–{s.endTime} ×
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <form action={action} className="space-y-3">
        <input type="hidden" name="slots" value={JSON.stringify(slots)} />
        <Feedback state={state} />
        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Enregistrement..." : "Enregistrer les disponibilités"}
        </button>
      </form>
    </div>
  );
}
