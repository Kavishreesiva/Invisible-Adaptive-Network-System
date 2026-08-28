import subprocess
import shutil
import logging
from datetime import datetime, timezone
from backend.models import BlockedSource
from backend.extensions import db
from backend.config import Config

logger = logging.getLogger(__name__)

class FirewallService:
    @staticmethod
    def is_nftables_available() -> bool:
        """Check if nftables binary exists and if running in LINUX_NATIVE mode."""
        if Config.EXECUTION_MODE != 'LINUX_NATIVE':
            return False
        return shutil.which('nft') is not None

    @classmethod
    def block_ip(cls, ip_address: str, reason: str = "Automated threat response") -> dict:
        """
        Block an IP address at network level (nftables) or application level (SIMULATION).
        """
        existing = BlockedSource.query.filter_by(ip_address=ip_address, is_active=True).first()
        if existing:
            return existing.to_dict()

        mode = 'NFTABLES' if cls.is_nftables_available() else 'SIMULATION'
        
        if mode == 'NFTABLES':
            try:
                # Controlled nftables call: nft add element inet filter blackhole { ip_address }
                subprocess.run(
                    ['nft', 'add', 'element', 'inet', 'filter', 'blackhole', f'{{ {ip_address} }}'],
                    check=True,
                    capture_output=True,
                    text=True
                )
                logger.info(f"IP {ip_address} blocked via native nftables")
            except Exception as e:
                logger.warning(f"Failed to execute nftables block for {ip_address}: {e}. Falling back to SIMULATION.")
                mode = 'SIMULATION'

        blocked = BlockedSource(
            ip_address=ip_address,
            reason=reason,
            blocked_at=datetime.now(timezone.utc),
            is_active=True,
            block_type=mode
        )
        db.session.add(blocked)
        db.session.commit()
        return blocked.to_dict()

    @classmethod
    def unblock_ip(cls, ip_address: str) -> bool:
        """
        Unblock an IP address.
        """
        blocked = BlockedSource.query.filter_by(ip_address=ip_address, is_active=True).first()
        if not blocked:
            return False

        if blocked.block_type == 'NFTABLES' and cls.is_nftables_available():
            try:
                subprocess.run(
                    ['nft', 'delete', 'element', 'inet', 'filter', 'blackhole', f'{{ {ip_address} }}'],
                    check=True,
                    capture_output=True,
                    text=True
                )
                logger.info(f"IP {ip_address} unblocked via native nftables")
            except Exception as e:
                logger.error(f"Failed to execute nftables unblock for {ip_address}: {e}")

        blocked.is_active = False
        db.session.commit()
        return True

    @classmethod
    def list_blocked_ips(cls) -> list:
        """Get all active blocked sources."""
        blocked_list = BlockedSource.query.filter_by(is_active=True).order_by(BlockedSource.blocked_at.desc()).all()
        return [b.to_dict() for b in blocked_list]

    @classmethod
    def is_ip_blocked(cls, ip_address: str) -> bool:
        """Check if an IP address is currently blocked."""
        blocked = BlockedSource.query.filter_by(ip_address=ip_address, is_active=True).first()
        return blocked is not None
