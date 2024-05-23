
from flask import Flask, render_template, jsonify, request, session,redirect, url_for, abort, make_response
import json, os, base64, math
from os import environ as env
from urllib.parse import quote_plus, urlencode
from authlib.integrations.flask_client import OAuth
from functools import wraps
# from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy

from data import *


app = Flask(__name__)
app.secret_key = env['FLASK_SECRET']

# load_dotenv()

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL")

#print(os.environ.get("DATABASE_URL"))
db = SQLAlchemy(app)

class UserPost(db.Model):

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.Text, nullable=False)
    email = db.Column(db.Text)
    user_img = db.Column(db.Text)
    content = db.Column(db.String(256), nullable=False)
    img = db.Column(db.LargeBinary)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    # geog = db.Column('(ST_X(ST_AsText(posts2.geog)), ST_Y(ST_AsText(posts2.geog)))', nullable=False)
    time = db.Column(db.DateTime(timezone=True), nullable=False)

    def custom_sql_query():
        query = db.session.execute(db.text("""select posts2.id, posts2.user_id, posts2.content, encode(posts2.img::bytea, 'base64') as "img", ST_X(ST_AsText(posts2.geog)) as "longitude", ST_Y(ST_AsText(posts2.geog)) as "latitude", posts2.time, users.name, users.email, users.img as "user_img" from posts2 inner join users on posts2.user_id=users.id """)).fetchall()

        return query

oauth = OAuth(app)

with app.app_context():
    setup()

oauth.register(
    "auth0",
    client_id=env.get("AUTH0_CLIENT_ID"),
    client_secret=env.get("AUTH0_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f'https://{env.get("AUTH0_DOMAIN")}/.well-known/openid-configuration'
)

@app.route("/login")
def login():
    return oauth.auth0.authorize_redirect(
        redirect_uri=url_for("callback", _external=True)
    )

@app.route("/callback", methods=["GET", "POST"])
def callback():
    token = oauth.auth0.authorize_access_token()
    session["user"] = token
    userinfo = session["user"]["userinfo"]
    name = userinfo["nickname"]
    email = userinfo["email"]
    img = userinfo["picture"]
    user_id = update_user(name, email, img)
    if (user_id is None):
        user_id = add_user(name, email, img)
        session["user_id"] = user_id
        return redirect("/welcome")
    session["user_id"] = user_id
    return redirect("/")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(
        "https://" + env.get("AUTH0_DOMAIN")
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("load_home", _external=True),
                "client_id": env.get("AUTH0_CLIENT_ID"),
            },
            quote_via=quote_plus,
        )
    )

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get('user') is None:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

@app.get("/welcome")
def new_user():
    return render_template("new_user.html")

@app.route("/", methods=['GET', 'POST'])
def load_home():
    if request.method == 'POST':
        if -90 <= float(request.form['create-lat']) <= 90 and -180 <= float(request.form['create-long']) <= 180:
            session['location'] = request.form
        else:
            return make_response("Invalid Coordinates for Sorting", 400)
    else:
        if request.args.get('recent') == 'true':
            session.pop('location', None)
    
    search_term = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    total = math.ceil( (get_total(search=search_term)['count'])/10 )
    if total == 0: total = 1
    if page < 1 or page > total:
        return make_response("Not Found. Invalid Page",404) #invalid page number
    if search_term:
        posts = search_posts_in_database(search_term=search_term, page=page, loc=session.get('location', None))
    else:
        posts = get_posts(loc=session.get('location', None), page=page)
    return render_template("home.html", search=search_term, posts=posts, page=page, total=total)


@app.get("/user/<int:user_id>")
def show_user_profile(user_id):
    page = request.args.get('page', 1, type=int)
    total = math.ceil( (get_total(id=user_id)['count'])/10 )
    if total == 0: total = 1
    if page < 1 or page > total:
        return make_response("Not Found. Invalid Page",404) #invalid page number
    posts = get_users_posts(user_id, page)
    user = get_users_info(user_id)
    return render_template("user_home.html", posts=posts, user=user, page=page, total=total)
    

@app.route("/create", methods=['GET', 'POST'])
@require_auth
def create_post():
    if request.method == 'GET':
        return render_template("create.html")
    else:
        fd = request.form
        img = request.files['image-input']
        user_id = session["user_id"]["id"]
        if add_post(fd, img, user_id) == 0:
            return make_response("Post Failed", 500)
        return redirect(f"/user/{user_id}")

@app.get("/edit/<int:user_id>")
@require_auth
def edit_post(user_id):
    if session['user_id']['id'] != user_id:
        return make_response("Forbidden. User can't access this page.",403)
    post_id = request.args.get('post', -1, type=int)
    post = get_single_post(post_id, user_id)
    if post is None:
        return make_response("Your post doesn't exist.",400) #post doesnt exist or not yours
    return render_template("edit_post.html", post=post, post_id=post_id)

@app.route("/api/post/delete", methods=['DELETE'])
@require_auth
def delete_user_post():
    post_id = request.json['id']
    if delete_post(post_id, session['user_id']['id']) == 0:
        resp = make_response("Invalid request", 400)
    else:
        resp = make_response("Row deleted", 200)
    resp.headers['Content-Type'] = "text/plain"
    return resp

@app.post("/api/post/edit")
@require_auth
def edit_user_post():
    fd = request.form
    img = request.files['image-input']
    if update_post(fd, img, session['user_id']['id']) == 0:
        return make_response("Invalid request", 400)
    return redirect(f"/user/{session['user_id']['id']}")

@app.route("/search", methods=['GET'])
def search_posts():
    search_term = request.args.get('q', '')
    posts = search_posts_in_database(search_term)
    return jsonify(posts) 



@app.route('/mapping', methods=['GET'])
def mapping():
    return render_template('map_main.html')

@app.route('/showlocations', methods=['GET'])
def get_info():

    posts = UserPost.custom_sql_query()
    
    post_package = []
    for post in posts:
        post_i = {
            'post_id': post.id,
            'user_id': post.user_id,
            'user_name': post.name,
            'user_email': post.email,
            'user_img': post.user_img,
            'content': post.content,
            'longitude': post.longitude,
            'latitude': post.latitude,
            # 'geog': post.geog,
            'time': post.time,
            'img': post.img
        }
        post_package.append(post_i)

    #print("post_package")

    return jsonify(post_package)


if __name__ == '__main__':
    app.run(debug=True)
