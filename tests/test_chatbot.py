from backend.services.chatbot_service import SOCChatbotService

def test_chatbot_ip_query(app):
    with app.app_context():
        res = SOCChatbotService.process_query("What is my current IP?")
        assert res["intent"] == "NETWORK_IP_QUERY"
        assert "Active Host IPv4" in res["reply"]
        assert len(res["quick_prompts"]) > 0

def test_chatbot_security_status_query(app):
    with app.app_context():
        res = SOCChatbotService.process_query("How is the security status?")
        assert res["intent"] == "SECURITY_STATUS_QUERY"
        assert "Security Operations Center Status" in res["reply"]

def test_chatbot_mtd_explanation_query(app):
    with app.app_context():
        res = SOCChatbotService.process_query("Explain Moving Target Defense")
        assert res["intent"] == "MTD_EXPLANATION"
        assert "Moving Target Defense" in res["reply"]

def test_chatbot_fallback_query(app):
    with app.app_context():
        res = SOCChatbotService.process_query("Hello bot")
        assert res["intent"] == "GENERAL_HELP"
        assert "IANSA AI SOC Assistant" in res["reply"]
