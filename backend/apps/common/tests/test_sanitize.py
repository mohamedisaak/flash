"""Tests for the HTML sanitiser (stored-XSS defence)."""

from apps.common.sanitize import clean_html


def test_strips_script_tags():
    out = clean_html("<p>Hello</p><script>alert('xss')</script>")
    assert "<script>" not in out
    assert "alert" not in out
    assert "Hello" in out


def test_strips_event_handlers_and_js_urls():
    out = clean_html('<a href="javascript:alert(1)" onclick="steal()">click</a>')
    assert "javascript:" not in out
    assert "onclick" not in out
    assert "click" in out  # link text preserved


def test_keeps_safe_formatting_and_links():
    out = clean_html('<p><strong>Bold</strong> and <a href="https://ok.example">link</a></p>')
    assert "<strong>" in out
    assert 'href="https://ok.example"' in out


def test_drops_iframe_and_object():
    out = clean_html('<iframe src="https://evil.example"></iframe><object></object><p>ok</p>')
    assert "<iframe" not in out
    assert "<object" not in out
    assert "ok" in out


def test_empty_passthrough():
    assert clean_html("") == ""
