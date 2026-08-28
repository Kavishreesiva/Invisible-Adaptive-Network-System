import re
from datetime import datetime, timezone
from backend.services.network_detector import NetworkDetector
from backend.services.policy_engine import PolicyEngine
from backend.services.firewall_service import FirewallService
from backend.models import SecurityEvent, BlockedSource, ProtectedService, EndpointRotation

class SOCChatbotService:
    @classmethod
    def process_query(cls, prompt, db_session=None):
        """
        Parses natural language queries and synthesizes real-time system context into AI responses.
        """
        clean_prompt = prompt.strip().lower()
        now = datetime.now(timezone.utc)

        # Fetch Live System Context
        detect_info = NetworkDetector.detect(db_session=db_session)
        current_ip = detect_info.get('current_ip', '127.0.0.1')
        network_name = detect_info.get('network_name', 'Local Network')
        open_services = detect_info.get('open_services', [])
        
        # 1. IP & Network Environment Queries
        if any(w in clean_prompt for w in ['ip', 'my ip', 'network', 'connect', 'wifi', 'address']):
            open_ports_str = ", ".join([f"Port {s['port']} ({s['service']})" for s in open_services]) or "None"
            reply = (
                f"🌐 **Live Network Environment Report**\n\n"
                f"• **Active Host IPv4**: `{current_ip}`\n"
                f"• **Detected Environment**: {network_name}\n"
                f"• **Operating System**: {detect_info.get('operating_system', 'Windows')}\n"
                f"• **Local Service Exposure**: {len(open_services)} listening ports\n"
                f"• **Active Listening Ports**: {open_ports_str}\n\n"
                f"*(Note: Whenever you switch Wi-Fi networks, IANSA automatically updates this IP in real time!)*"
            )
            return {
                "reply": reply,
                "intent": "NETWORK_IP_QUERY",
                "quick_prompts": ["How is the security status?", "Show active threat IPs", "Explain Moving Target Defense"]
            }

        # 2. Overall Security Status Queries
        if any(w in clean_prompt for w in ['status', 'secure', 'health', 'overview', 'security']):
            blocked_count = BlockedSource.query.filter_by(is_active=True).count() if db_session else 0
            total_events = SecurityEvent.query.count() if db_session else 0
            recent_high = SecurityEvent.query.filter(SecurityEvent.severity.in_(['HIGH', 'CRITICAL'])).count() if db_session else 0

            status_badge = "🟢 NORMAL SECURE" if recent_high == 0 else "🔴 ACTIVE THREATS DETECTED"
            reply = (
                f"🛡️ **IANSA Security Operations Center Status**: **{status_badge}**\n\n"
                f"• **Active Firewall Blocks**: `{blocked_count}` IPs quarantined\n"
                f"• **Total Logged Events**: `{total_events}` security events\n"
                f"• **High/Critical Threats (Last 24h)**: `{recent_high}` events\n"
                f"• **Current Host IP**: `{current_ip}` ({network_name})\n\n"
                f"All stealth microservices are operating behind the IANSA protective gateway mesh."
            )
            return {
                "reply": reply,
                "intent": "SECURITY_STATUS_QUERY",
                "quick_prompts": ["Show blocked IPs", "Explain MTD", "Simulate an attack"]
            }

        # 3. Blocked IPs / Firewall Queries
        if any(w in clean_prompt for w in ['block', 'blocked', 'firewall', 'quarantine', 'unblock']):
            blocked_sources = BlockedSource.query.filter_by(is_active=True).all() if db_session else []
            if not blocked_sources:
                reply = "🟢 **Firewall Status**: No IP addresses are currently quarantined by the firewall rules."
            else:
                ip_list = "\n".join([f"• `{b.ip_address}` — Reason: {b.reason}" for b in blocked_sources])
                reply = (
                    f"🚨 **Currently Quarantined IP Sources ({len(blocked_sources)})**:\n\n"
                    f"{ip_list}\n\n"
                    f"You can unblock any IP with 1 click directly from the **Security Events Table**!"
                )
            return {
                "reply": reply,
                "intent": "FIREWALL_BLOCKED_QUERY",
                "quick_prompts": ["Check my IP", "How does threat scoring work?", "Simulate an attack"]
            }

        # 4. Moving Target Defense (MTD) Explanation
        if any(w in clean_prompt for w in ['mtd', 'moving target', 'rotate', 'stealth', 'adaptation']):
            recent_rotations = EndpointRotation.query.order_by(EndpointRotation.timestamp.desc()).limit(3).all() if db_session else []
            rot_str = ""
            if recent_rotations:
                rot_str = "\n\n**Recent Endpoint Shifts**:\n" + "\n".join(
                    [f"• {r.service_name}: `{r.previous_endpoint}` → `{r.new_endpoint}`" for r in recent_rotations]
                )
            
            reply = (
                f"🔄 **Moving Target Defense (MTD) Concept**:\n\n"
                f"Traditional networks are static targets. IANSA constantly rotates internal service endpoints "
                f"and hidden ports so an attacker's reconnaissance map becomes invalid in real time!{rot_str}\n\n"
                f"Whenever a threat score reaches **CRITICAL (75+)**, MTD automatically rotates service routes!"
            )
            return {
                "reply": reply,
                "intent": "MTD_EXPLANATION",
                "quick_prompts": ["Rotate web server now", "Check my IP", "How is security status?"]
            }

        # 5. Attack Simulation / How to Test
        if any(w in clean_prompt for w in ['simulate', 'attack', 'test', 'demo', 'nmap', 'fuzz']):
            reply = (
                f"⚡ **Lab Attack Simulator**:\n\n"
                f"You can trigger simulated attacks (such as Nmap SYN Port Scans, Directory Fuzzing, or Exploit Probes) "
                f"by clicking the **'Simulate Attack'** button in the top navigation bar!\n\n"
                f"Watch how the Policy Engine automatically detects the attack, increases the threat score, and triggers an IP Quarantine & Endpoint Rotation!"
            )
            return {
                "reply": reply,
                "intent": "SIMULATION_GUIDE",
                "quick_prompts": ["Check my IP", "Show blocked IPs", "How does threat scoring work?"]
            }

        # Default Helpful SOC Assistant Fallback
        return {
            "reply": (
                f"🤖 **IANSA AI SOC Assistant Ready**!\n\n"
                f"I am monitoring your network at `{current_ip}` ({network_name}).\n"
                f"You can ask me questions like:\n"
                f"• *'What is my IP?'*\n"
                f"• *'How is the security status?'*\n"
                f"• *'Show blocked IPs'*\n"
                f"• *'Explain Moving Target Defense'*"
            ),
            "intent": "GENERAL_HELP",
            "quick_prompts": ["Check my IP", "How is security status?", "Show blocked IPs", "Explain MTD"]
        }
