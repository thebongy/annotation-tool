import uuid
import sqlite3
import os
from exceptions import InvalidUsage
from flask import jsonify

from config import *

class Database:
    def __init__(self, db):
        self.db = db
        self.cursor = self.db.cursor()
    def create_new_project(self, projectName):
        projectID = str(uuid.uuid4())
        print("Creating project", projectID)
        self.dbExec("INSERT INTO PROJECTS VALUES (?,?)", (projectID, projectName))
        return projectID

    def dbExec(self, query, args=None):
        print(args)
        out = self.cursor.execute(query, args).fetchall()
        self.db.commit()
        return out

    def get_project_by_ID(self, ID):
        project = self.dbExec("SELECT * FROM PROJECTS WHERE ID=?", (ID,))[0]
        if (project is None):
            return None
        return {
            "id": project[0],
            "name": project[1],
            "files": self.get_project_files(ID)
        }
    def get_project_files(self, projectID):
        filesData = self.dbExec("SELECT * FROM FILES WHERE PROJECT=?", (projectID,))
        files = []
        for file in filesData:
            files.append({
                "id": file[0],
                "project": file[1],
                "type": file[2],
                "original": file[3]
                })
        return files
    def add_file_to_project(self, file, projectID):
        fileName = file.filename
        ext = fileName[fileName.find("."):]
        print(fileName, "with ext", ext)

        if ext.lower() in (".jpg", ".png"):
            file_type = "image"
        elif ext.lower() in (".mp4", ".webm", ".avi", ".wmv", ".mov"):
            file_type = "video"
        else:
            file_type = "unknown"
            raise InvalidUsage("File specified is not a video/image")

        fileID = str(uuid.uuid4())

        new_file_name = fileID + ext
        new_file_path = os.path.join(DATA_FOLDER, new_file_name)
        print("saving", fileName, "to", new_file_path)
        file.save(new_file_path)

        self.dbExec("INSERT INTO FILES VALUES (?,?,?,?)", (new_file_name, projectID, file_type, fileName))
        return {"original": fileName, "id":new_file_name, "type": file_type}

    def delete_file(self, fileID):
        self.dbExec("DELETE FROM FILES WHERE ID=?", (fileID,))
        os.remove(os.path.join("data", fileID))