from flask import Flask, render_template, request, g, redirect, jsonify, send_from_directory, send_file
import json
import sqlite3

from database import Database
from exceptions import InvalidUsage

DATABASE = './data/data.db'

app = Flask(__name__)

app.config['UPLOAD_FOLDER'] = "./data"

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return Database(db)

@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

@app.route("/")
def home_page():
    return render_template("index.html", page="home")

@app.route("/new")
def create_new_project():
    db = get_db()
    newID = db.create_new_project(request.args.get("projectName"))
    if (newID == None):
        print("Error while creating DB")
        return redirect("/")
    else:
        return redirect("/project/%s" % newID)


@app.route("/project/<projectID>")
def annotater_page(projectID):
    db = get_db()
    project = db.get_project_by_ID(projectID)
    print(project)
    return render_template("annotate.html", project=project, page="annotate")

@app.route("/project/<projectID>/upload", methods=["POST"])
def upload_file(projectID):
    db = get_db()
    print(request.files)
    return jsonify(db.add_file_to_project(request.files["file"], projectID))

@app.route("/deleteFile/<fileID>", methods=["POST"])
def deleteFile(fileID):
    db = get_db()
    db.delete_file(fileID)
    return "Success"

@app.route("/data/<fileID>")
def getFile(fileID):
    print("Sending")
    return send_file((app.config['UPLOAD_FOLDER']+"/%s") % fileID, conditional=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
