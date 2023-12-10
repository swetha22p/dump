from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
from datetime import datetime
from bson.objectid import ObjectId
from bson.errors import InvalidId
from bson.json_util import dumps, loads



app = Flask(__name__)
CORS(app)

LOGSTASH_ENDPOINT = 'http://localhost:9600'
# Configure MongoDB
app.config['MONGO_URI'] = 'mongodb://localhost:27017/your_database_name'
mongo = PyMongo(app)

@app.route('/bulkAddMedicalData', methods=['OPTIONS'])
def handle_options():
    response = app.make_default_options_response()
    response.headers['Access-Control-Allow-Methods'] = 'POST'  # Add other allowed methods if needed
    return response
@app.route('/submit', methods=['POST'])
def submit():
    message = request.form['message']
    
    # Send message to Logstash
    logstash_payload = {'message': message}
    response = requests.post(LOGSTASH_ENDPOINT, json=logstash_payload)
    
    if response.status_code == 200:
        return 'Message submitted successfully!'
    else:
        return 'Error submitting message to Logstash'
@app.route('/medicalForm', methods=['POST'])
def save_medical_form():
    try:
        medical_records = request.json

        # Ensure that medical_records is a list
        if not isinstance(medical_records, list):
            return jsonify({"error": "Invalid data format. Expected a list of medical records."}), 400

        for medical_data in medical_records:
            # Add timestamp to the data
            if 'createdAt' in medical_data and 'timestamp' in medical_data:
                return jsonify({"error": "Both 'createdAt' and 'timestamp' cannot be provided"}), 400

            # If 'timestamp' is provided, use it; otherwise, use the current time as 'createdAt'
            timestamp = medical_data.get('timestamp', None)
            if timestamp is not None:
                medical_data['createdAt'] = datetime.utcfromtimestamp(timestamp / 1000.0)
            else:
                medical_data['createdAt'] = datetime.utcnow()

            # Store the data in MongoDB
            mongo.db.medical_forms.insert_one(medical_data)

        return jsonify({"message": "Medical form data saved successfully"})
    except Exception as e:
        app.logger.error(f"Error saving medical form data: {str(e)}")
        return jsonify({"error": str(e)}), 500
# @app.route('/getMedicalData', methods=['GET'])
# def get_medical_data():
#     try:
#         medical_data = list(mongo.db.medical_forms.find())  # Retrieve all medical records

#         # Convert ObjectId to string in the response using dumps
#         serialized_data = dumps(medical_data)

#         return serialized_data
#     except InvalidId:
#         return jsonify({"error": "Invalid ObjectId"}), 400
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
@app.route('/getMedicalData/<string:id>', methods=['GET'])
def get_medical_data_by_id(id):
    try:
        # Use ObjectId to convert the string id to a valid ObjectId
        medical_data = mongo.db.medical_forms.find_one({'_id': ObjectId(id)})

        if medical_data:
            # Convert ObjectId to string in the response using dumps
            serialized_data = dumps(medical_data)
            return serialized_data
        else:
            return jsonify({"message": "Medical record not found"}), 404

    except InvalidId:
        return jsonify({"error": "Invalid ObjectId"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/deleteMedicalData/<string:id>', methods=['DELETE'])
def delete_medical_data(id):
    try:
        # Use ObjectId to convert the string id to a valid ObjectId
        mongo.db.medical_forms.delete_one({'_id': ObjectId(id)})

        return jsonify({"message": "Medical record deleted successfully"})
    except InvalidId:
        return jsonify({"error": "Invalid ObjectId"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/updateMedicalData/<string:id>', methods=['PUT', 'PATCH'])
def update_medical_data(id):
    try:
        # Ensure that the request has a JSON payload
        if not request.is_json:
            raise BadRequest("Invalid request format. JSON expected.")

        # Get the updated data from the JSON payload
        updated_data = request.json

        # Validate the updated data here if needed

        # Use ObjectId to convert the string id to a valid ObjectId
        mongo.db.medical_forms.update_one({'_id': ObjectId(id)}, {'$set': updated_data})

        return jsonify({"message": "Medical record updated successfully"})
    except BadRequest as e:
        return jsonify({"error": str(e)}), 400
    except InvalidId:
        return jsonify({"error": "Invalid ObjectId"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
