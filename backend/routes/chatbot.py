from flask import Blueprint, request, jsonify
from backend.services.chatbot_service import SOCChatbotService
from backend.extensions import db

chatbot_bp = Blueprint('chatbot', __name__, url_prefix='/api/chatbot')

@chatbot_bp.route('/query', methods=['POST'])
def query_chatbot():
    """
    Processes natural language prompts and returns AI SOC Assistant responses with system context.
    """
    data = request.get_json() or {}
    prompt = data.get('prompt', '')

    if not prompt:
        return jsonify({"error": "Bad Request", "message": "prompt is required"}), 400

    result = SOCChatbotService.process_query(prompt, db_session=db.session)
    return jsonify(result), 200
