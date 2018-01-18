from flask import Flask
from flask_restful import Api
from services.flask.authhandler import oauthloginrequest,oauthlogincallback

app = Flask(__name__)
api = Api(app)

api.add_resource(oauthloginrequest, '/oauthloginrequest')
api.add_resource(oauthlogincallback, '/oauthlogincallback')

if __name__ == '__main__':
    app.run(debug=True)