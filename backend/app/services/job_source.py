"""Safe extraction of job descriptions from public web pages."""
from __future__ import annotations

import html
import ipaddress
import json
import re
import socket
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener


MAX_RESPONSE_BYTES = 2 * 1024 * 1024
MAX_REDIRECTS = 3
USER_AGENT = "OpenMatch/0.2 (+job-description-import)"


class JobSourceError(ValueError):
    """A user-actionable job source extraction error."""


def validate_public_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise JobSourceError("Use a complete public http:// or https:// URL.")
    if parsed.username or parsed.password:
        raise JobSourceError("URLs containing credentials are not supported.")

    try:
        addresses = {
            item[4][0]
            for item in socket.getaddrinfo(parsed.hostname, parsed.port or 443)
        }
    except socket.gaierror as exc:
        raise JobSourceError("The job page hostname could not be resolved.") from exc

    for address in addresses:
        ip = ipaddress.ip_address(address)
        if not ip.is_global:
            raise JobSourceError("Only public internet job pages can be imported.")
    return url


class _SafeRedirectHandler(HTTPRedirectHandler):
    redirect_count = 0

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        self.redirect_count += 1
        if self.redirect_count > MAX_REDIRECTS:
            raise JobSourceError("The job page redirected too many times.")
        safe_url = validate_public_url(urljoin(req.full_url, newurl))
        return super().redirect_request(req, fp, code, msg, headers, safe_url)


class _JobPageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.meta: dict[str, str] = {}
        self.json_ld: list[str] = []
        self.body_parts: list[str] = []
        self._capture_title = False
        self._capture_json = False
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag in {"script", "style", "noscript", "svg", "nav", "footer"}:
            self._skip_depth += 1
        if tag == "title":
            self._capture_title = True
        if tag == "script" and "ld+json" in values.get("type", "").lower():
            self._capture_json = True
            self._skip_depth = max(0, self._skip_depth - 1)
        if tag == "meta":
            key = values.get("property") or values.get("name")
            content = values.get("content")
            if key and content:
                self.meta[key.lower()] = content.strip()
        if tag in {"p", "li", "h1", "h2", "h3", "br"} and self._skip_depth == 0:
            self.body_parts.append("\n")

    def handle_endtag(self, tag):
        if tag == "title":
            self._capture_title = False
        if tag == "script" and self._capture_json:
            self._capture_json = False
        elif tag in {"script", "style", "noscript", "svg", "nav", "footer"}:
            self._skip_depth = max(0, self._skip_depth - 1)

    def handle_data(self, data):
        if self._capture_json:
            self.json_ld.append(data)
        elif self._capture_title:
            self.title += data
        elif self._skip_depth == 0:
            cleaned = data.strip()
            if cleaned:
                self.body_parts.append(cleaned)


def extract_job_description_from_url(url: str) -> dict:
    safe_url = validate_public_url(url)
    request = Request(
        safe_url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    opener = build_opener(_SafeRedirectHandler())

    try:
        with opener.open(request, timeout=10) as response:
            content_type = response.headers.get_content_type()
            if content_type not in {"text/html", "application/xhtml+xml"}:
                raise JobSourceError("The URL does not point to an HTML job page.")
            raw = response.read(MAX_RESPONSE_BYTES + 1)
            if len(raw) > MAX_RESPONSE_BYTES:
                raise JobSourceError("The job page is too large to import safely.")
            charset = response.headers.get_content_charset() or "utf-8"
            final_url = response.geturl()
    except JobSourceError:
        raise
    except HTTPError as exc:
        if "linkedin.com" in urlparse(safe_url).hostname.lower():
            raise JobSourceError(
                "LinkedIn did not expose this page publicly. Paste the job description "
                "or use an approved LinkedIn integration."
            ) from exc
        raise JobSourceError(f"The job page returned HTTP {exc.code}.") from exc
    except (URLError, TimeoutError, OSError) as exc:
        raise JobSourceError("The job page could not be reached.") from exc

    validate_public_url(final_url)
    document = raw.decode(charset, errors="replace")
    parser = _JobPageParser()
    parser.feed(document)
    structured = _find_job_posting(parser.json_ld)
    final_hostname = (urlparse(final_url).hostname or "").lower()
    if "linkedin.com" in final_hostname and not structured:
        raise JobSourceError(
            "LinkedIn did not expose structured public job data. Paste the job "
            "description or connect an approved LinkedIn partner integration."
        )

    if structured:
        title = _plain_text(str(structured.get("title", "")))
        company_value = structured.get("hiringOrganization") or {}
        company = (
            company_value.get("name", "")
            if isinstance(company_value, dict)
            else str(company_value)
        )
        description_parts = [
            structured.get("description"),
            structured.get("responsibilities"),
            structured.get("qualifications"),
            structured.get("skills"),
        ]
        text = "\n\n".join(
            _plain_text(str(value))
            for value in description_parts
            if value
        )
        extraction_method = "structured_job_posting"
    else:
        title = parser.meta.get("og:title") or parser.title.strip()
        company = ""
        description = (
            parser.meta.get("description")
            or parser.meta.get("og:description")
            or ""
        )
        body_text = _normalize_text(" ".join(parser.body_parts))
        text = "\n\n".join(part for part in (_plain_text(description), body_text) if part)
        extraction_method = "public_page_text"

    text = _normalize_text(text)
    if len(text) < 80:
        raise JobSourceError(
            "The public page did not expose enough job-description text. Paste the "
            "description instead."
        )

    return {
        "url": final_url,
        "title": _normalize_text(title)[:160],
        "company": _normalize_text(company)[:160] or None,
        "job_description": text[:30_000],
        "extraction_method": extraction_method,
        "notice": (
            "Imported from publicly available page content. Review the text before analysis."
        ),
    }


def _find_job_posting(scripts: list[str]) -> dict | None:
    for script in scripts:
        try:
            data = json.loads(script)
        except (json.JSONDecodeError, TypeError):
            continue
        found = _walk_for_job_posting(data)
        if found:
            return found
    return None


def _walk_for_job_posting(value) -> dict | None:
    if isinstance(value, dict):
        item_type = value.get("@type")
        types = item_type if isinstance(item_type, list) else [item_type]
        if "JobPosting" in types:
            return value
        for child in value.values():
            found = _walk_for_job_posting(child)
            if found:
                return found
    elif isinstance(value, list):
        for child in value:
            found = _walk_for_job_posting(child)
            if found:
                return found
    return None


def _plain_text(value: str) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", html.unescape(value))
    return _normalize_text(without_tags)


def _normalize_text(value: str) -> str:
    value = re.sub(r"[ \t\r\f\v]+", " ", value)
    value = re.sub(r"\n\s*\n\s*\n+", "\n\n", value)
    return value.strip()
