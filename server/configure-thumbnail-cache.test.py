import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('cache_policy', Path(__file__).with_name('configure-thumbnail-cache.py'))
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)


class CachePolicyTest(unittest.TestCase):
    def test_preserves_password_gate_and_defaults_to_no_store(self):
        source = '''server {
    auth_request /__preview_check;
    add_header Cache-Control "private, no-store" always;
    location = /__preview_check { internal; auth_request off; }
    location /api/ { proxy_pass https://origin; }
    location / { try_files $uri /index.html; }
}'''
        result = policy.transform(source)
        self.assertEqual(result.count('auth_request'), source.count('auth_request'))
        self.assertIn('auth_request /__preview_check;', result)
        self.assertIn('location / { try_files $uri /index.html; }', result)
        self.assertIn('"/api/ai-support-chat:GET:image/webp" $crafton_thumbnail_expiry;', result)
        self.assertIn('"~^private, max-age=[0-9]+$"', result)
        self.assertEqual(policy.transform(result), result)

    def test_refuses_an_unexpected_configuration(self):
        with self.assertRaises(AssertionError):
            policy.transform('server { location /api/ { proxy_pass https://origin; } }')


if __name__ == '__main__':
    unittest.main()
