import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'iansa-super-secret-key-change-in-production-2026')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'iansa-jwt-secret-key-2026-adaptive-security')
    
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    DB_DIR = os.path.join(BASE_DIR, '..', 'database')
    os.makedirs(DB_DIR, exist_ok=True)
    
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f'sqlite:///{os.path.join(DB_DIR, "iansa_security.db")}'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    
    # Suricata log directory or eve.json path
    SURICATA_LOG_PATH = os.environ.get('SURICATA_LOG_PATH', '/var/log/suricata/eve.json')
    
    # Mode: 'SIMULATION' or 'LINUX_NATIVE'
    EXECUTION_MODE = os.environ.get('IANSA_EXECUTION_MODE', 'SIMULATION')
