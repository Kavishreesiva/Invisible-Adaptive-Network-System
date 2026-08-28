def test_login_success(client):
    res = client.post('/api/auth/login', json={'username': 'test_admin', 'password': 'pass123'})
    assert res.status_code == 200
    data = res.get_json()
    assert 'access_token' in data
    assert data['user']['username'] == 'test_admin'
    assert data['user']['role'] == 'admin'

def test_login_invalid_password(client):
    res = client.post('/api/auth/login', json={'username': 'test_admin', 'password': 'wrongpassword'})
    assert res.status_code == 401

def test_login_missing_fields(client):
    res = client.post('/api/auth/login', json={'username': 'test_admin'})
    assert res.status_code == 400
