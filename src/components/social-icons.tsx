import type { ReactNode } from "react";
import {
  getSocialPlatform,
  normalizeSocialPlatformId,
} from "@/lib/social-platforms";

type IconProps = { className?: string };

function IconShell({
  children,
  className = "h-4 w-4",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export function SocialPlatformIcon({
  platform,
  className,
}: {
  platform: string;
  className?: string;
}) {
  const id = normalizeSocialPlatformId(platform);
  const props: IconProps = { className };

  switch (id) {
    case "twitter":
      return (
        <IconShell {...props}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.924L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
        </IconShell>
      );
    case "instagram":
      return (
        <IconShell {...props}>
          <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2A3.2 3.2 0 1112 8.8a3.2 3.2 0 010 6.4z" />
          <path d="M17.5 6.4a1.1 1.1 0 11-2.2 0 1.1 1.1 0 012.2 0z" />
          <path d="M12 2.2c-2.7 0-3 .01-4.1.06-1.1.05-1.85.23-2.5.49a5 5 0 00-1.8 1.17 5 5 0 00-1.17 1.8c-.26.65-.44 1.4-.49 2.5C2.21 9 2.2 9.3 2.2 12s.01 3 .06 4.1c.05 1.1.23 1.85.49 2.5a5 5 0 001.17 1.8 5 5 0 001.8 1.17c.65.26 1.4.44 2.5.49 1.1.05 1.4.06 4.1.06s3-.01 4.1-.06c1.1-.05 1.85-.23 2.5-.49a5 5 0 001.8-1.17 5 5 0 001.17-1.8c.26-.65.44-1.4.49-2.5.05-1.1.06-1.4.06-4.1s-.01-3-.06-4.1c-.05-1.1-.23-1.85-.49-2.5a5 5 0 00-1.17-1.8 5 5 0 00-1.8-1.17c-.65-.26-1.4-.44-2.5-.49C15 2.21 14.7 2.2 12 2.2zm0 1.8c2.65 0 2.96.01 4 .06.97.04 1.5.2 1.85.34.46.18.79.39 1.14.74.35.35.56.68.74 1.14.13.35.3.88.34 1.85.05 1.04.06 1.35.06 4s-.01 2.96-.06 4c-.04.97-.2 1.5-.34 1.85-.18.46-.39.79-.74 1.14-.35.35-.68.56-1.14.74-.35.13-.88.3-1.85.34-1.04.05-1.35.06-4 .06s-2.96-.01-4-.06c-.97-.04-1.5-.2-1.85-.34a3.1 3.1 0 01-1.14-.74 3.1 3.1 0 01-.74-1.14c-.13-.35-.3-.88-.34-1.85C4.01 14.96 4 14.65 4 12s.01-2.96.06-4c.04-.97.2-1.5.34-1.85.18-.46.39-.79.74-1.14.35-.35.68-.56 1.14-.74.35-.13.88-.3 1.85-.34 1.04-.05 1.35-.06 4-.06z" />
        </IconShell>
      );
    case "twitch":
      return (
        <IconShell {...props}>
          <path d="M4.25 2.25 2.5 5.5v13.75h4.5V21.5l2.25-2.25h3.5L19.5 12V2.25H4.25zm13.5 8.75-3.25 3.25h-3.5l-2.25 2.25v-2.25H6.5V4h11.25v7z" />
          <path d="M14.5 6.5h1.75v5H14.5v-5zm-4.25 0H12v5h-1.75v-5z" />
        </IconShell>
      );
    case "youtube":
      return (
        <IconShell {...props}>
          <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.5 31.5 0 0024 12a31.5 31.5 0 00-.5-5.8zM9.75 15.5v-7l6.2 3.5-6.2 3.5z" />
        </IconShell>
      );
    case "tiktok":
      return (
        <IconShell {...props}>
          <path d="M19.6 7.2a5.7 5.7 0 01-3.4-1.1v8.1a5.9 5.9 0 11-5.9-5.9c.3 0 .6 0 .9.1v2.9a3 3 0 00-.9-.1 3 3 0 103 3V2.5h2.8a5.7 5.7 0 003.5 3.4v1.3z" />
        </IconShell>
      );
    case "faceit":
      return (
        <IconShell {...props}>
          <path d="M3 4.5h7.2L12 9.2l1.8-4.7H21L13.8 19.5h-3.6L3 4.5zm5.1 2.7 2.4 6.3 2.4-6.3H8.1z" />
        </IconShell>
      );
    case "tracker":
      return (
        <IconShell {...props}>
          <path d="M4 19h16v2H4v-2zm2-3h2.5V9H6v7zm4.5 0H13V5h-2.5v11zm4.5 0H18V12h-2.5v4z" />
        </IconShell>
      );
    case "steam":
      return (
        <IconShell {...props}>
          <path d="M12 2a10 10 0 00-9.6 12.7l5.1-2.1a3.2 3.2 0 015.9-1.5l4.1 3a3.8 3.8 0 11-.9 1.5l-4.1-3a3.2 3.2 0 01-4.5.4l-5.3 2.2A10 10 0 1012 2zm7.3 14.2a2 2 0 10.01 0zM10.5 9.8a1.8 1.8 0 10.01 0z" />
        </IconShell>
      );
    case "kick":
      return (
        <IconShell {...props}>
          <path d="M4 3h5.2v6.3L15.5 3H21l-7.2 7.3L21 21h-5.6l-6.2-7.8V21H4V3z" />
        </IconShell>
      );
    case "website":
    default:
      return (
        <IconShell {...props}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </IconShell>
      );
  }
}

export function SocialLinkChip({
  platform,
  url,
  onRemove,
}: {
  platform: string;
  url: string;
  onRemove?: () => void;
}) {
  const meta = getSocialPlatform(platform);
  const content = (
    <>
      <SocialPlatformIcon platform={meta.id} className="h-3.5 w-3.5" />
      <span>{meta.label}</span>
      {onRemove ? <span aria-hidden>×</span> : null}
    </>
  );

  if (onRemove) {
    return (
      <button type="button" className="social-chip" onClick={onRemove} title={url}>
        {content}
      </button>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="social-chip"
      title={meta.label}
    >
      {content}
    </a>
  );
}

export function SocialLinksRow({
  links,
}: {
  links: { label: string; url: string }[];
}) {
  if (links.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {links.map((l) => (
        <SocialLinkChip key={`${l.label}-${l.url}`} platform={l.label} url={l.url} />
      ))}
    </div>
  );
}

/** Rangée d’icônes cliquables (roster). */
export function SocialIconLinks({
  links,
}: {
  links: { label: string; url: string }[];
}) {
  if (links.length === 0) return null;
  return (
    <div className="roster-socials">
      {links.map((l) => {
        const meta = getSocialPlatform(l.label);
        return (
          <a
            key={`${l.label}-${l.url}`}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="roster-social"
            title={meta.label}
            aria-label={meta.label}
          >
            <SocialPlatformIcon platform={meta.id} className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
}

export function DiscordIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.3 4.4A19 19 0 0015.9 3l-.3.6a17.5 17.5 0 014 1.9 16 16 0 00-12.8 0 17.5 17.5 0 014-1.9L10.1 3A19 19 0 003.7 4.4C.9 9.1.2 13.7.6 18.2a19.4 19.4 0 005.9 3l.8-1.3a12.6 12.6 0 01-1.8-.9l.4-.3c3.6 1.7 7.5 1.7 11 0l.5.3a12.6 12.6 0 01-1.8.9l.8 1.3a19.4 19.4 0 005.9-3c.5-5.2-.7-9.7-3-13.8zM8.3 15.4c-1.1 0-2-.9-2-2.1s.9-2.1 2-2.1 2 1 2 2.1-.9 2.1-2 2.1zm7.4 0c-1.1 0-2-.9-2-2.1s.9-2.1 2-2.1 2 1 2 2.1-.9 2.1-2 2.1z" />
    </svg>
  );
}
