import uuid
import logging
from datetime import datetime, timezone
from backend.models import ProtectedService, EndpointRotation
from backend.extensions import db
from backend.config import Config

logger = logging.getLogger(__name__)

class EndpointAdaptationService:
    @classmethod
    def generate_dynamic_endpoint(cls, service_name: str) -> str:
        """Generates a randomized stealth endpoint string (e.g. service-91af32.internal)."""
        random_hash = uuid.uuid4().hex[:6]
        clean_name = service_name.lower().replace(' ', '-').replace('_', '-')
        return f"{clean_name}-{random_hash}.internal"

    @classmethod
    def rotate_service_endpoint(cls, service_key: str, reason: str, triggered_event_id: int = None) -> dict:
        """
        Executes controlled endpoint rotation for a protected service.
        Updates application routes/aliases (SIMULATION) and optionally configures local iptables/nftables mapping (NETWORK).
        """
        service = ProtectedService.query.filter_by(service_key=service_key).first()
        if not service:
            # Fallback lookup by name
            service = ProtectedService.query.filter_by(name=service_key).first()

        if not service:
            logger.error(f"Protected service '{service_key}' not found for endpoint rotation.")
            return {"error": f"Service '{service_key}' not found"}

        previous_endpoint = service.current_endpoint
        new_endpoint = cls.generate_dynamic_endpoint(service.name)

        mode = 'NETWORK' if Config.EXECUTION_MODE == 'LINUX_NATIVE' else 'SIMULATION'

        # Update service in DB
        service.current_endpoint = new_endpoint
        service.visibility = 'HIDDEN'
        service.last_event_at = datetime.now(timezone.utc)

        # Log EndpointRotation history
        rotation = EndpointRotation(
            service_name=service.name,
            previous_endpoint=previous_endpoint,
            new_endpoint=new_endpoint,
            reason=reason,
            timestamp=datetime.now(timezone.utc),
            triggered_event_id=triggered_event_id,
            mode=mode
        )

        db.session.add(rotation)
        db.session.commit()

        logger.info(f"Rotated endpoint for {service.name}: {previous_endpoint} -> {new_endpoint} [{mode}]")

        return rotation.to_dict()

    @classmethod
    def get_rotation_history(cls, limit: int = 50) -> list:
        """Returns recent endpoint rotation records."""
        rotations = EndpointRotation.query.order_by(EndpointRotation.timestamp.desc()).limit(limit).all()
        return [r.to_dict() for r in rotations]
