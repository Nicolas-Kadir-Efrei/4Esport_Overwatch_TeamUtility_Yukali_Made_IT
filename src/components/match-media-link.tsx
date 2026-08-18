import { SocialPlatformIcon } from "@/components/social-icons";
import {
  detectLinkPlatformFromUrl,
  getSocialPlatform,
} from "@/lib/social-platforms";

export function MatchMediaLink({
  title,
  url,
  description,
}: {
  title: string;
  url: string;
  description?: string | null;
}) {
  const platform = detectLinkPlatformFromUrl(url);
  const meta = getSocialPlatform(platform);
  const isTwitch = platform === "twitch";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`match-media-link ${isTwitch ? "is-twitch" : ""}`}
    >
      <span className="match-media-icon" aria-hidden>
        <SocialPlatformIcon platform={platform} className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="match-media-kicker">
          {isTwitch ? "VOD Twitch" : meta.label}
        </span>
        <span className="match-media-title">{title}</span>
        {description ? (
          <span className="match-media-desc">{description}</span>
        ) : null}
      </span>
    </a>
  );
}
