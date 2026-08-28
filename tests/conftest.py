import pytest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.extensions import db
from backend.models import User, ProtectedService, PolicyRule
from backend.config import Config

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_SECRET_KEY = 'test_secret_key_32_bytes_minimum_length_requirement_ok'

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        # Seed test accounts
        admin = User(username='test_admin', role='admin')
        admin.set_password('pass123')

        analyst = User(username='test_analyst', role='analyst')
        analyst.set_password('pass123')

        user = User(username='test_user', role='user')
        user.set_password('pass123')

        service = ProtectedService(
            name="Web Server",
            service_key="web_server",
            port=8080,
            status="ONLINE",
            current_endpoint="service-a.internal",
            default_endpoint="service-a.internal",
            visibility="HIDDEN"
        )

        rule = PolicyRule(
            name="Recon Block Rule",
            condition_type="THREAT_SCORE_THRESHOLD",
            threshold_score=50,
            action="BLOCK",
            is_active=True
        )

        db.session.add_all([admin, analyst, user, service, rule])
        db.session.commit()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def admin_token(client):
    res = client.post('/api/auth/login', json={'username': 'test_admin', 'password': 'pass123'})
    return res.get_json()['access_token']

@pytest.fixture
def user_token(client):
    res = client.post('/api/auth/login', json={'username': 'test_user', 'password': 'pass123'})
    return res.get_json()['access_token']
