import urllib.request
import json

req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', 
    data=b'username=test%40example.com&password=password123',
    headers={'Content-Type': 'application/x-www-form-urlencoded'})
token_res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
token = token_res['access_token']

req = urllib.request.Request('http://127.0.0.1:8000/api/v1/chats/',
    data=b'{}',
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
chat_res = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
chat_id = chat_res['id']

req = urllib.request.Request(f'http://127.0.0.1:8000/api/v1/chats/{chat_id}/messages/stream',
    data=json.dumps({"content": "Hi"}).encode('utf-8'),
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'})
print(urllib.request.urlopen(req).read().decode('utf-8'))
