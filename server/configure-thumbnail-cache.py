"""Allow only signed WebP responses to retain bounded private browser caching.

Preserves the preview password check, all other no-store responses and origin ACLs.
Run after deploying the API. Writes the existing bind-mounted file in place.
"""
from pathlib import Path
import datetime
import re
import shutil
import subprocess
import urllib.error
import urllib.request

MARKER = '# Crafton signed thumbnail browser cache v1'
MAPS = '''# Crafton signed thumbnail browser cache v1
map $upstream_http_cache_control $crafton_thumbnail_expiry {
    default "private, no-store";
    "~^private, max-age=[0-9]+$" $upstream_http_cache_control;
}
map "$uri:$request_method:$upstream_http_content_type" $crafton_image_cache_policy {
    default "private, no-store";
    "/api/ai-support-chat:GET:image/webp" $crafton_thumbnail_expiry;
}

'''
HEADERS = '''
        # Inherit the password check; cache only the signed image response.
        proxy_hide_header Cache-Control;
        add_header Cache-Control $crafton_image_cache_policy always;
        add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
'''


def transform(text):
    if MARKER in text:
        assert 'add_header Cache-Control $crafton_image_cache_policy always;' in text
        return text
    assert 'auth_request /__preview_check;' in text, 'Expected preview password protection'
    assert 'add_header Cache-Control "private, no-store" always;' in text
    changed, count = re.subn(r'(location /api/ \{)', lambda m: m.group(1) + HEADERS, text)
    assert count == 1, 'Expected one protected API location'
    assert changed.count('auth_request') == text.count('auth_request')
    return MAPS + changed


def run(*args):
    return subprocess.run(args, check=True, text=True, capture_output=True)


def main():
    if not Path('/opt/crafton-preview/enabled').exists():
        print('Preview gate absent; API private cache headers apply directly.')
        return
    target = Path('/opt/crafton-edge/default.conf')
    before = target.read_text()
    after = transform(before)
    if after == before:
        print('Signed thumbnail cache policy already installed.')
        return
    backup = Path('/var/backups/crafton') / ('thumbnail-cache-' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
    backup.mkdir(parents=True, mode=0o700)
    shutil.copy2(target, backup / 'edge.conf')
    try:
        target.write_text(after)
        run('docker', 'exec', 'crafton-edge', 'nginx', '-t')
        run('docker', 'exec', 'crafton-edge', 'nginx', '-s', 'reload')
        # The new cache exception must never bypass the preview password gate.
        request = urllib.request.Request('https://thecrafton.com/api/ai-support-chat?thumbnail=' + '0' * 64)
        try:
            urllib.request.urlopen(request, timeout=15)
        except urllib.error.HTTPError as error:
            assert error.code == 401, 'Anonymous thumbnail request must require the preview password'
        else:
            raise RuntimeError('Anonymous thumbnail request unexpectedly succeeded')
    except Exception:
        target.write_text(before)
        run('docker', 'exec', 'crafton-edge', 'nginx', '-t')
        run('docker', 'exec', 'crafton-edge', 'nginx', '-s', 'reload')
        raise
    print('Signed WebP private browser caching enabled; anonymous request remains HTTP 401.')


if __name__ == '__main__':
    main()
