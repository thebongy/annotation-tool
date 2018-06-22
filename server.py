from flask import Flask, render_template, url_for

app = Flask(__name__)

@app.route("/")
def home():
    print(url_for('static',filename='css/bootstrap.min.css'))
    return render_template("index.html")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)