from appdirs import AppDirs
import os
import shutil

appname = "annotation-tool"
appauthor = "thebongy"

dirs = AppDirs("annotation-tool", "thebongy", version="0.1")

DATA_FOLDER = dirs.user_data_dir

TEMPLATE_DATA_FILE = "./data/data.db"
print("Data folder set to", DATA_FOLDER)

DATABASE = DATA_FOLDER + "/data.db"

if not os.path.exists(DATA_FOLDER):
    print ("Data folder", DATA_FOLDER, "does not exist. Creating folder...")
    os.makedirs(DATA_FOLDER)

if not os.path.exists(DATABASE):
    print ("Database file", DATABASE, "does not exist. Creating file...")
    shutil.copy2(TEMPLATE_DATA_FILE, DATABASE)