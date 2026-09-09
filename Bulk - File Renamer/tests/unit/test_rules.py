from pathlib import Path
from plugins.examples.basic_rules import PrefixRule, SuffixRule, ReplaceRule

def test_prefix_rule():
    rule = PrefixRule(prefix="TEST_")
    result = rule.apply("file.txt", Path("file.txt"), 0)
    assert result == "TEST_file.txt"

def test_suffix_rule():
    rule = SuffixRule(suffix="_TEST")
    result = rule.apply("file.txt", Path("file.txt"), 0)
    assert result == "file_TEST.txt"
    
def test_replace_rule():
    rule = ReplaceRule(target="foo", replacement="bar")
    result = rule.apply("foo_baz.txt", Path("foo_baz.txt"), 0)
    assert result == "bar_baz.txt"
