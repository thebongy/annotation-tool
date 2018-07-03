from flask import Flask, render_template, request, g, redirect, jsonify, send_from_directory, send_file
import json
import sqlite3
import os
import sys

from database import Database
from exceptions import InvalidUsage

from config import *

if getattr(sys, 'frozen', False):
    print("FROZEN MODE")
    template_folder = os.path.join(sys._MEIPASS, 'templates')
    static_folder = os.path.join(sys._MEIPASS, 'static')
    
    print(template_folder)
    print(os.listdir(sys._MEIPASS))
    print(os.listdir("."))
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
else:
    app = Flask(__name__)

app.config['UPLOAD_FOLDER'] = DATA_FOLDER

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
    
    return render_template("annotate.html", project=project, page="annotate")

@app.route("/project/<projectID>/upload", methods=["POST"])
def upload_file(projectID):
    db = get_db()
    return jsonify(db.add_file_to_project(request.files["file"], projectID))

@app.route("/project/<fileID>/data", methods=["GET","POST"])
def file_annotations(fileID):
    db = get_db()
    if request.method == "POST":
        data = request.get_json(force=True)
        print(data)
        db.store_file_annotations(fileID, data)
        return "Success"
    elif request.method == "GET":
        data = db.get_file_annotations(fileID)
        return jsonify(data)
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
