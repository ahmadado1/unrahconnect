"""Search public Adhan archives and download a matching MP3.

Live sources:

* Internet Archive advanced search (https://archive.org/advancedsearch.php)
  and each item's public metadata (https://archive.org/metadata/<id>).
* Assabile's public Adhan directory (https://www.assabile.com/adhan-call-prayer).

``is_fajr=True`` keeps titles that say Fajr, Morning, or the Fajr line
"as-salatu khayrun minan-nawm". Surah Al-Fajr, the Quran chapter, is not
treated as a call to prayer. A daytime Adhan is not reused as a Fajr file.

Many listings never name a maqam. If ``style`` is set and the title does not
say Ahzan, Saba, Hijaz, or whatever you passed, that track is left out.

Offline checks can use ``SAMPLE_TRACKS`` via ``use_samples=True``. The Hijaz
sample points at a non-routable host so it cannot be downloaded by mistake.

Install:
    python3 -m pip install requests beautifulsoup4

Search:
    python3 scripts/adhan_finder.py "Mishary Rashid Alafasy" --fajr

Download the first hit into audio/adhans/:
    python3 scripts/adhan_finder.py "Mishary Rashid Alafasy" --fajr --download
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator, Optional
from urllib.parse import quote, urlparse

import requests
from bs4 import BeautifulSoup

# A browser User-Agent. The default "python-requests" agent is often answered
# with HTTP 403 by these archives.
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/128.0.0.0 Safari/537.36"
)

ARCHIVE_SEARCH_URL = "https://archive.org/advancedsearch.php"
ARCHIVE_METADATA_URL = "https://archive.org/metadata/{identifier}"
ARCHIVE_DOWNLOAD_URL = "https://archive.org/download/{identifier}/{filename}"
ASSABILE_DIRECTORY_URL = "https://www.assabile.com/adhan-call-prayer"

DEFAULT_TIMEOUT = 30
MAX_DOWNLOAD_BYTES = 40 * 1024 * 1024
ARCHIVE_RESULT_LIMIT = 12
AUDIO_DIR = Path("audio/adhans")

# Tokens that show up in names but do not identify a reciter.
_STOP_TOKENS = {
    "al",
    "el",
    "bin",
    "ibn",
    "sheikh",
    "shaykh",
    "shaikh",
    "imam",
    "qari",
    "the",
    "and",
}

# Spelling variants folded onto one token before matching.
_TOKEN_ALIASES = {
    "muhammad": "mohamed",
    "mohammed": "mohamed",
    "mohamad": "mohamed",
    "mohammad": "mohamed",
    "ahmad": "ahmed",
    "ahmd": "ahmed",
    "abdullah": "abdallah",
    "abdulah": "abdallah",
    "adhan": "azan",
    "athan": "azan",
}

_FAJR_MARKERS = (
    "fajr",
    "fadjr",
    "morning",
    "sobh",
    "subh",
    "khayrun",
    "khairun",
    "minan-nawm",
    "minan nawm",
    "خير من النوم",
    "صلاة الفجر",
)

_ADHAN_MARKERS = ("adhan", "azan", "athan", "adan", "أذان", "اذان")


class AdhanFetchError(Exception):
    """A public archive refused the request or did not return audio."""


@dataclass(frozen=True)
class AdhanTrack:
    """One public MP3 and the fields used to filter it."""

    title: str
    url: str
    source: str
    reciter: str
    is_fajr: bool
    duration: Optional[str] = None
    style: Optional[str] = None
    identifier: Optional[str] = None
    downloadable: bool = True

    def describe(self) -> str:
        kind = "fajr" if self.is_fajr else "day"
        style = f", {self.style}" if self.style else ""
        return f"[{self.source}] {self.title} ({kind}{style})\n  {self.url}"


SAMPLE_TRACKS: tuple[AdhanTrack, ...] = (
    AdhanTrack(
        title="Azan Noreen",
        url="https://archive.org/download/azan-noreen/Azan%20noreen.mp3",
        source="sample",
        reciter="Noreen Muhammad Sadiq",
        is_fajr=False,
        identifier="azan-noreen",
    ),
    AdhanTrack(
        title="Mishary Rashid Alafasy — Adhan Al Fajr Al Kuwait",
        url="https://media.assabile.com/assabile/adhan_3435370/b91e1c5095cd.mp3",
        source="sample",
        reciter="Mishary Rashid Alafasy",
        is_fajr=True,
        duration="04:48",
        style=None,
    ),
    AdhanTrack(
        title="Sample only — Ali Ahmed Mulla Adhan Al Fajr Hijaz",
        url="https://example.invalid/audio/adhans/ali_ahmed_mulla_hijaz_fajr.mp3",
        source="sample",
        reciter="Ali Ahmed Mulla",
        is_fajr=True,
        style="Hijaz",
        downloadable=False,
    ),
)


def slugify(value: str) -> str:
    """Turn a reciter or style into a safe filename piece."""
    text = value.strip().lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")


def filename_for(
    reciter_name: str,
    is_fajr: bool = False,
    style: Optional[str] = None,
) -> str:
    """Build a name like ``ali_ahmed_mulla_hijaz_fajr.mp3``."""
    parts = [slugify(reciter_name)]
    if style:
        parts.append(slugify(style))
    if is_fajr:
        parts.append("fajr")
    stem = "_".join(part for part in parts if part) or "adhan"
    return f"{stem}.mp3"


def _normalize_token(token: str) -> str:
    token = token.lower().strip("'_")
    return _TOKEN_ALIASES.get(token, token)


def _tokens(value: str) -> list[str]:
    raw = re.findall(r"[^\W\d_]+", value.lower(), flags=re.UNICODE)
    tokens = [_normalize_token(token) for token in raw]
    return [token for token in tokens if len(token) >= 3 and token not in _STOP_TOKENS]


def _contains_term(text: str, term: str) -> bool:
    """Whole-word match so 'Saba' does not hit the name 'Sabaawe'."""
    pattern = rf"(?<!\w){re.escape(term.strip().lower())}(?!\w)"
    return re.search(pattern, text.lower()) is not None


def _looks_like_fajr(text: str) -> bool:
    lowered = text.lower()
    return any(marker in lowered for marker in _FAJR_MARKERS)


def _looks_like_adhan(text: str) -> bool:
    lowered = text.lower()
    return any(marker in lowered for marker in _ADHAN_MARKERS)


def _reciter_in_text(reciter_name: str, text: str) -> bool:
    wanted = _tokens(reciter_name)
    if not wanted:
        return False
    haystack = set(_tokens(text))
    return all(token in haystack for token in wanted)


def _style_in_text(style: Optional[str], text: str) -> bool:
    if not style or not style.strip():
        return True
    return _contains_term(text, style.strip())


def _matches(
    track: AdhanTrack,
    reciter_name: str,
    is_fajr: bool,
    style: Optional[str],
) -> bool:
    blob = " ".join(
        part
        for part in (track.title, track.reciter, track.style or "", track.url)
        if part
    )
    if not _reciter_in_text(reciter_name, blob):
        return False
    if _looks_like_fajr(blob) != is_fajr:
        return False
    return _style_in_text(style, blob)


def _dedupe(tracks: Iterable[AdhanTrack]) -> list[AdhanTrack]:
    seen: set[str] = set()
    unique: list[AdhanTrack] = []
    for track in tracks:
        key = track.url.split("?")[0]
        if key in seen:
            continue
        seen.add(key)
        unique.append(track)
    return unique


class AdhanFinder:
    """Query Assabile and Archive.org, then stream a chosen MP3 to disk."""

    def __init__(
        self,
        session: Optional[requests.Session] = None,
        timeout: int = DEFAULT_TIMEOUT,
    ) -> None:
        self.timeout = timeout
        self.session = session or requests.Session()
        self.session.headers["User-Agent"] = USER_AGENT
        self.session.headers["Accept"] = "application/json, text/html, audio/mpeg, */*"
        self.last_warnings: list[str] = []
        self._assabile_cache: Optional[list[AdhanTrack]] = None

    def search(
        self,
        reciter_name: str,
        is_fajr: bool = False,
        style: Optional[str] = None,
        use_samples: bool = False,
    ) -> list[AdhanTrack]:
        """Return public tracks for this reciter, Fajr flag, and maqam."""
        self.last_warnings = []
        if use_samples:
            return [track for track in SAMPLE_TRACKS if _matches(track, reciter_name, is_fajr, style)]

        found: list[AdhanTrack] = []
        for source in (self._search_archive, self._search_assabile):
            try:
                found.extend(source(reciter_name, is_fajr, style))
            except AdhanFetchError as exc:
                self.last_warnings.append(str(exc))
        return _dedupe(found)

    def iter_audio(self, url: str) -> Iterator[bytes]:
        """Yield MP3 bytes. Raises AdhanFetchError on 403, 404, or a non-audio body."""
        self._require_http_url(url)
        try:
            response = self.session.get(url, stream=True, timeout=self.timeout)
        except requests.RequestException as exc:
            raise AdhanFetchError(f"Could not reach {url}: {exc}") from exc

        try:
            if response.status_code == 403:
                raise AdhanFetchError(
                    f"HTTP 403 from {url}. The request already used a browser User-Agent."
                )
            if response.status_code == 404:
                raise AdhanFetchError(f"HTTP 404. No file at {url}.")
            try:
                response.raise_for_status()
            except requests.HTTPError as exc:
                raise AdhanFetchError(f"HTTP {response.status_code} from {url}.") from exc

            content_type = (response.headers.get("Content-Type") or "").lower()
            if "text/html" in content_type or "application/json" in content_type:
                raise AdhanFetchError(f"{url} returned {content_type or 'a page'}, not an MP3.")

            total = 0
            started = False
            for chunk in response.iter_content(chunk_size=64 * 1024):
                if not chunk:
                    continue
                if not started:
                    if not _looks_like_audio(chunk, content_type):
                        raise AdhanFetchError(f"{url} did not start with MP3 data.")
                    started = True
                total += len(chunk)
                if total > MAX_DOWNLOAD_BYTES:
                    raise AdhanFetchError(
                        f"{url} is larger than {MAX_DOWNLOAD_BYTES // (1024 * 1024)} MB."
                    )
                yield chunk
            if not started:
                raise AdhanFetchError(f"{url} was empty.")
        finally:
            response.close()

    def download(
        self,
        track: AdhanTrack,
        dest_dir: Path = AUDIO_DIR,
        filename: Optional[str] = None,
    ) -> Path:
        """Stream ``track`` into ``dest_dir`` and return the saved path."""
        if not track.downloadable:
            raise AdhanFetchError(f"Sample track is not a live file: {track.url}")

        dest_dir.mkdir(parents=True, exist_ok=True)
        name = filename or filename_for(track.reciter, track.is_fajr, track.style)
        if Path(name).name != name:
            raise AdhanFetchError("Filename must not include a directory.")
        destination = dest_dir / name
        temporary = destination.with_suffix(destination.suffix + ".part")

        try:
            with temporary.open("wb") as handle:
                for chunk in self.iter_audio(track.url):
                    handle.write(chunk)
        except Exception:
            temporary.unlink(missing_ok=True)
            raise

        temporary.replace(destination)
        return destination

    def _search_archive(
        self,
        reciter_name: str,
        is_fajr: bool,
        style: Optional[str],
    ) -> list[AdhanTrack]:
        tokens = _tokens(reciter_name)
        if not tokens:
            return []

        name_clause = " AND ".join(
            f'(title:"{token}" OR creator:"{token}")' for token in tokens
        )
        query = (
            "(title:(adhan OR azan OR athan OR adan) "
            "OR description:(adhan OR azan OR athan)) "
            f"AND mediatype:audio AND ({name_clause})"
        )
        payload = self._get_json(
            ARCHIVE_SEARCH_URL,
            params={
                "q": query,
                "fl[]": ["identifier", "title", "creator"],
                "rows": ARCHIVE_RESULT_LIMIT,
                "page": 1,
                "output": "json",
            },
        )
        docs = (payload.get("response") or {}).get("docs") or []
        tracks: list[AdhanTrack] = []
        for doc in docs:
            identifier = str(doc.get("identifier") or "").strip()
            if not identifier:
                continue
            try:
                tracks.extend(self._tracks_from_archive_item(identifier, doc))
            except AdhanFetchError as exc:
                self.last_warnings.append(str(exc))
        return [track for track in tracks if _matches(track, reciter_name, is_fajr, style)]

    def _tracks_from_archive_item(
        self,
        identifier: str,
        doc: dict,
    ) -> list[AdhanTrack]:
        metadata = self._get_json(ARCHIVE_METADATA_URL.format(identifier=quote(identifier)))
        item_title = _first_text(doc.get("title")) or identifier
        creator = _first_text(doc.get("creator"))
        tracks: list[AdhanTrack] = []
        for entry in metadata.get("files") or []:
            name = str(entry.get("name") or "")
            if not name.lower().endswith(".mp3"):
                continue
            file_title = str(entry.get("title") or name)
            blob = f"{item_title} {creator} {file_title} {name}"
            if not _looks_like_adhan(blob) and not _looks_like_fajr(blob):
                continue
            tracks.append(
                AdhanTrack(
                    title=file_title if file_title != name else item_title,
                    url=ARCHIVE_DOWNLOAD_URL.format(
                        identifier=quote(identifier),
                        filename=quote(name),
                    ),
                    source="archive.org",
                    reciter=creator or item_title,
                    is_fajr=_looks_like_fajr(blob),
                    duration=_format_length(entry.get("length")),
                    identifier=identifier,
                )
            )
        return tracks

    def _search_assabile(
        self,
        reciter_name: str,
        is_fajr: bool,
        style: Optional[str],
    ) -> list[AdhanTrack]:
        catalog = self._assabile_catalog()
        return [track for track in catalog if _matches(track, reciter_name, is_fajr, style)]

    def _assabile_catalog(self) -> list[AdhanTrack]:
        if self._assabile_cache is not None:
            return self._assabile_cache

        response = self._get(ASSABILE_DIRECTORY_URL)
        soup = BeautifulSoup(response.text, "html.parser")
        tracks: list[AdhanTrack] = []
        for anchor in soup.select("a.link-media"):
            href = (anchor.get("href") or "").strip()
            path = urlparse(href).path.lower()
            if not path.endswith(".mp3"):
                continue
            label = anchor.select_one("span.sorting")
            title = label.get_text(" ", strip=True) if label else anchor.get_text(" ", strip=True)
            if not title:
                continue
            reciter, _, _detail = title.partition(" - ")
            duration = anchor.get("data-duration")
            tracks.append(
                AdhanTrack(
                    title=title,
                    url=href,
                    source="assabile",
                    reciter=reciter.strip() or title,
                    is_fajr=_looks_like_fajr(title),
                    duration=str(duration) if duration else None,
                )
            )
        self._assabile_cache = tracks
        return tracks

    def _get(self, url: str, **kwargs: object) -> requests.Response:
        try:
            response = self.session.get(url, timeout=self.timeout, **kwargs)  # type: ignore[arg-type]
        except requests.RequestException as exc:
            raise AdhanFetchError(f"Could not reach {url}: {exc}") from exc
        if response.status_code == 403:
            raise AdhanFetchError(f"HTTP 403 from {url}.")
        if response.status_code == 404:
            raise AdhanFetchError(f"HTTP 404 from {url}.")
        try:
            response.raise_for_status()
        except requests.HTTPError as exc:
            raise AdhanFetchError(f"HTTP {response.status_code} from {url}.") from exc
        return response

    def _get_json(self, url: str, **kwargs: object) -> dict:
        response = self._get(url, **kwargs)
        try:
            payload = response.json()
        except ValueError as exc:
            raise AdhanFetchError(f"{url} did not return JSON.") from exc
        if not isinstance(payload, dict):
            raise AdhanFetchError(f"{url} returned an unexpected JSON document.")
        return payload

    @staticmethod
    def _require_http_url(url: str) -> None:
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise AdhanFetchError(f"Refusing non-http URL: {url}")
        if parsed.hostname == "example.invalid":
            raise AdhanFetchError(f"Sample URL is not downloadable: {url}")


def _first_text(value: object) -> str:
    if isinstance(value, list):
        return str(value[0]).strip() if value else ""
    if value is None:
        return ""
    return str(value).strip()


def _format_length(value: object) -> Optional[str]:
    if value is None or value == "":
        return None
    try:
        seconds = int(float(str(value)))
    except ValueError:
        return str(value)
    minutes, secs = divmod(seconds, 60)
    return f"{minutes:02d}:{secs:02d}"


def _looks_like_audio(chunk: bytes, content_type: str) -> bool:
    if "audio/" in content_type or "mpeg" in content_type or "octet-stream" in content_type:
        return True
    if chunk.startswith(b"ID3"):
        return True
    # MPEG frame sync.
    return len(chunk) >= 2 and chunk[0] == 0xFF and (chunk[1] & 0xE0) == 0xE0


def find_adhan(
    reciter_name: str,
    is_fajr: bool = False,
    style: Optional[str] = None,
    use_samples: bool = False,
) -> list[AdhanTrack]:
    """Search public archives for one reciter.

    ``style`` is a maqam name such as "Ahzan", "Saba", or "Hijaz". Leave it
    empty when the recording's maqam is unknown.
    """
    return AdhanFinder().search(
        reciter_name,
        is_fajr=is_fajr,
        style=style,
        use_samples=use_samples,
    )


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Find a public Adhan MP3 by reciter.")
    parser.add_argument("reciter_name", help='Example: "Mishary Rashid Alafasy"')
    parser.add_argument(
        "--fajr",
        action="store_true",
        help="Keep only Fajr calls (Fajr, Morning, or khayrun minan-nawm).",
    )
    parser.add_argument("--style", default=None, help='Maqam, for example "Hijaz".')
    parser.add_argument(
        "--download",
        action="store_true",
        help="Save the first match under audio/adhans/.",
    )
    parser.add_argument(
        "--samples",
        action="store_true",
        help="Filter the built-in sample URLs instead of calling the archives.",
    )
    parser.add_argument(
        "--dest",
        default=str(AUDIO_DIR),
        help="Download directory. Default: audio/adhans",
    )
    return parser


def main(argv: Optional[list[str]] = None) -> int:
    args = _build_parser().parse_args(argv)
    finder = AdhanFinder()
    tracks = finder.search(
        args.reciter_name,
        is_fajr=args.fajr,
        style=args.style,
        use_samples=args.samples,
    )
    for warning in finder.last_warnings:
        print(f"warning: {warning}", file=sys.stderr)

    if not tracks:
        print("No matching public Adhan.")
        return 1

    for track in tracks:
        print(track.describe())
        print()

    if args.download:
        saved = finder.download(tracks[0], dest_dir=Path(args.dest))
        print(f"saved {saved}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
