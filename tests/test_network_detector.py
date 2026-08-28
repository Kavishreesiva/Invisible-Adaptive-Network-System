from backend.services.network_detector import NetworkDetector

def test_primary_ip_detection():
    ip = NetworkDetector.get_primary_ip()
    assert isinstance(ip, str)
    assert len(ip.split('.')) == 4

def test_network_classification():
    name, ntype = NetworkDetector.classify_network("10.5.12.3")
    assert ntype == "ENTERPRISE_WIFI"

    name, ntype = NetworkDetector.classify_network("192.168.1.100")
    assert ntype == "HOME_PG_WIFI"

    name, ntype = NetworkDetector.classify_network("127.0.0.1")
    assert ntype == "LOCAL"

def test_local_listening_services_scan():
    services = NetworkDetector.scan_listening_services()
    assert isinstance(services, list)

def test_network_detection_payload(app):
    with app.app_context():
        result = NetworkDetector.detect()
        assert "current_ip" in result
        assert "network_name" in result
        assert "open_services" in result
        assert result["status"] == "CONNECTED"
