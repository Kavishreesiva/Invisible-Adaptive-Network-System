from backend.services.endpoint_adaptation import EndpointAdaptationService
from backend.models import ProtectedService, EndpointRotation

def test_endpoint_rotation(app):
    with app.app_context():
        service = ProtectedService.query.filter_by(service_key='web_server').first()
        old_endpoint = service.current_endpoint

        res = EndpointAdaptationService.rotate_service_endpoint('web_server', reason='Test endpoint rotation')
        assert 'new_endpoint' in res
        assert res['previous_endpoint'] == old_endpoint
        assert service.current_endpoint != old_endpoint
        assert service.current_endpoint.endswith('.internal')

        # Check history
        history = EndpointAdaptationService.get_rotation_history()
        assert len(history) >= 1
        assert history[0]['service_name'] == 'Web Server'
