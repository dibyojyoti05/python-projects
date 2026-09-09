import pytest
from engines.extraction.parser import DataParser

SAMPLE_HTML = """
<html>
  <head><title>Test Store</title></head>
  <body>
    <div class="product">
      <h2 class="title">Wireless Noise Canceling Headphones</h2>
      <span class="price">$199.99</span>
      <a class="buy" href="/item/1">Buy Now</a>
    </div>
    <div class="product">
      <h2 class="title">Mechanical Gaming Keyboard</h2>
      <span class="price">$89.50</span>
      <a class="buy" href="/item/2">Buy Now</a>
    </div>
  </body>
</html>
"""

def test_data_parser_css():
    parser = DataParser(SAMPLE_HTML)
    titles = parser.extract_css("h2.title")
    prices = parser.extract_css("span.price")
    links = parser.extract_css("a.buy", attribute="href")

    assert len(titles) == 2
    assert titles[0] == "Wireless Noise Canceling Headphones"
    assert prices[1] == "$89.50"
    assert links[0] == "/item/1"

def test_data_parser_xpath():
    parser = DataParser(SAMPLE_HTML)
    titles = parser.extract_xpath("//h2[@class='title']")
    assert len(titles) == 2
    assert "Headphones" in titles[0]

def test_data_parser_extract_records():
    parser = DataParser(SAMPLE_HTML)
    schema = {
        "name": {"type": "css", "selector": "h2.title", "attribute": "text"},
        "price": {"type": "css", "selector": "span.price", "attribute": "text"},
        "link": {"type": "css", "selector": "a.buy", "attribute": "href"}
    }
    records = parser.extract_records(schema)
    assert len(records) == 2
    assert records[0]["name"] == "Wireless Noise Canceling Headphones"
    assert records[0]["price"] == "$199.99"
    assert records[0]["link"] == "/item/1"
    assert records[1]["name"] == "Mechanical Gaming Keyboard"
