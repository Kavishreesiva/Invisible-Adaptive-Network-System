def test_protected_access_with_user_token(client, user_token):
    res = client.get('/api/protected', headers={'Authorization': f'Bearer {user_token}'})
    assert res.status_code == 200
    assert res.get_json()['role'] == 'user'

def test_admin_access_with_user_token_forbidden(client, user_token):
    res = client.get('/api/admin', headers={'Authorization': f'Bearer {user_token}'})
    assert res.status_code == 403
    data = res.get_json()
    assert 'Forbidden' in data['error']

def test_admin_access_with_admin_token_success(client, admin_token):
    res = client.get('/api/admin', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    assert res.get_json()['role'] == 'admin'

def test_unauthenticated_access(client):
    res = client.get('/api/protected')
    assert res.status_code == 401
