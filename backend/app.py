import os
import sys
from flask import Flask, jsonify

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.config import Config
from backend.extensions import db, jwt, cors
from backend.routes import (
    auth_bp,
    protected_bp,
    dashboard_bp,
    events_bp,
    network_bp,
    policies_bp,
    services_bp,
    simulation_bp,
    tracker_bp
)
from backend.routes.chatbot import chatbot_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(protected_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(network_bp)
    app.register_blueprint(policies_bp)
    app.register_blueprint(services_bp)
    app.register_blueprint(simulation_bp)
    app.register_blueprint(tracker_bp)
    app.register_blueprint(chatbot_bp)

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not Found", "message": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

    # Ensure tables exist and seed project tracker if empty
    with app.app_context():
        db.create_all()
        from backend.services.tracker_service import TrackerService
        TrackerService.ensure_seeded()

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    print(f"[*] Starting IANSA Security Gateway Backend on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
