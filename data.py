import psycopg2
import os
import logging

from contextlib import contextmanager
from flask import g, current_app
from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor

pool = None

def setup():
    global pool
    DATABASE_URL = os.environ['DATABASE_URL']
    current_app.logger.info("creating database connection pool")
    pool = ThreadedConnectionPool(1,20,dsn=DATABASE_URL,sslmode="require")

@contextmanager
def get_connection():
    try:
        conn = pool.getconn()
        yield conn
    finally:
        pool.putconn(conn)

@contextmanager
def get_cursor(commit=False):
    with get_connection() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        yield cursor
        if commit:
            conn.commit()
    finally:
        cursor.close()

def add_post(fd, img, id):
    with get_cursor(True) as cur:
        current_app.logger.info("Adding post data")
        imgData = img.read()
        imgBin = psycopg2.Binary(imgData)
        cur.execute("""insert into posts2 (user_id, content, img, geog) values
            (%s, %s, %s, ST_MakePoint(%s,%s))""", (id, fd["create-text"], imgBin, fd["create-long"], fd["create-lat"]))
        return cur.rowcount
    
def get_posts(loc=None, page=1):
    with get_cursor() as cur:
        current_app.logger.info("Getting feed post data")
        if loc is None:
            cur.execute("""select posts2.id, posts2.user_id, posts2.content, encode(posts2.img::bytea, 'base64') as "img",
                (ST_Y(ST_AsText(posts2.geog)), ST_X(ST_AsText(posts2.geog))) as "geog", ST_Y(ST_AsText(posts2.geog)) as "lat", ST_X(ST_AsText(posts2.geog)) as "lon", posts2.time, users.name, users.img as user_img from posts2 
                inner join users on posts2.user_id=users.id order by posts2.time desc limit 10 offset %s""", ((page-1)*10,))
        else:
            cur.execute("""select posts2.id, posts2.user_id, posts2.content, encode(posts2.img::bytea, 'base64') as "img",
                (ST_Y(ST_AsText(posts2.geog)), ST_X(ST_AsText(posts2.geog))) as "geog", ST_Y(ST_AsText(posts2.geog)) as "lat", ST_X(ST_AsText(posts2.geog)) as "lon", posts2.time, users.name, users.img as user_img from posts2 
                inner join users on posts2.user_id=users.id 
                order by ST_Distance(posts2.geog, ST_MakePoint(%s,%s)) limit 10 offset %s""", (loc["create-long"], loc["create-lat"], (page-1)*10))
        return cur.fetchall()

def get_single_post(post_id,user_id):
    with get_cursor() as cur:
        current_app.logger.info("Getting single post data")
        cur.execute("select content, ST_Y(ST_AsText(geog)) as lat, ST_X(ST_AsText(geog)) as long from posts2 where id=%s and user_id=%s",(post_id,user_id))
        return cur.fetchone()

def add_user(name, email, img):
    with get_cursor(True) as cur:
        current_app.logger.info("Adding new user data")
        cur.execute("insert into users (name, email, img) values (%s,%s,%s) returning id", (name, email, img))
        return cur.fetchone()

def update_user(name, email, img):
    with get_cursor(True) as cur:
        current_app.logger.info("Updating user data")
        cur.execute("update users set name = %s, img = %s where email = %s returning id", (name, img, email))
        return cur.fetchone()

def get_total(id=-1, search=''):
    with get_cursor() as cur:
        current_app.logger.info("Getting total posts")
        if (id != -1):
            cur.execute("select count(*) from posts2 inner join users on posts2.user_id=users.id where posts2.user_id=%s", (id,))
            return cur.fetchone()
        if (search != ''):
            cur.execute("select count(*) from posts2 inner join users on posts2.user_id=users.id where posts2.content ILIKE %s", ('%'+search+'%',))
            return cur.fetchone()
        cur.execute("select count(*) from posts2 inner join users on posts2.user_id=users.id")
        return cur.fetchone()
        

def get_users_posts(user_id, page=1):
    with get_cursor() as cur:
        current_app.logger.info("Getting users post data")
        cur.execute("""select posts2.id, posts2.user_id, posts2.content, encode(posts2.img::bytea, 'base64') as "img",
            (ST_Y(ST_AsText(posts2.geog)), ST_X(ST_AsText(posts2.geog))) as "geog", ST_Y(ST_AsText(posts2.geog)) as "lat", ST_X(ST_AsText(posts2.geog)) as "lon", posts2.time, users.name, users.img as user_img from posts2 
            inner join users on posts2.user_id=users.id where posts2.user_id=%s order by posts2.time desc limit 10 offset %s""", (user_id,(page-1)*10))
        return cur.fetchall()

def get_users_info(user_id):
    with get_cursor() as cur:
        current_app.logger.info("Getting users info")
        cur.execute("select * from users where id=%s", (user_id,))
        return cur.fetchone()

def update_post(fd, img, user_id):
    with get_cursor(True) as cur:
        current_app.logger.info("Updating single post data")
        imgData = img.read()
        imgBin = psycopg2.Binary(imgData)
        cur.execute("update posts2 set content=%s, img=%s, geog=ST_MakePoint(%s,%s), time=current_timestamp where id=%s and user_id=%s", (fd['create-text'], imgBin, fd["create-long"], fd["create-lat"], fd['post-id'], user_id))
        return cur.rowcount

def delete_post(post_id, user_id):
    with get_cursor(True) as cur:
        current_app.logger.info("Deleting single post data")
        cur.execute("delete from posts2 where id=%s and user_id=%s", (post_id,user_id))
        return cur.rowcount
    
def search_posts_in_database(search_term, page=1, loc=None):
    with get_cursor() as cur:
        current_app.logger.info("Getting with search term")
        if loc is None:
            cur.execute("""SELECT posts2.id, posts2.user_id, posts2.content, encode(posts2.img::bytea, 'base64') as "img",
                            (ST_Y(ST_AsText(posts2.geog)), ST_X(ST_AsText(posts2.geog))) as "geog", ST_Y(ST_AsText(posts2.geog)) as "lat", ST_X(ST_AsText(posts2.geog)) as "lon", posts2.time, users.name, users.img as user_img 
                            FROM posts2 
                            INNER JOIN users ON posts2.user_id=users.id 
                            WHERE posts2.content ILIKE %s
                            ORDER BY posts2.time DESC LIMIT 10 OFFSET %s""", ('%' + search_term + '%', (page-1)*10))
        else:
            cur.execute("""SELECT posts2.id, posts2.user_id, posts2.content, encode(posts2.img::bytea, 'base64') as "img",
                            (ST_Y(ST_AsText(posts2.geog)), ST_X(ST_AsText(posts2.geog))) as "geog", ST_Y(ST_AsText(posts2.geog)) as "lat", ST_X(ST_AsText(posts2.geog)) as "lon", posts2.time, users.name, users.img as user_img 
                            FROM posts2 
                            INNER JOIN users ON posts2.user_id=users.id 
                            WHERE posts2.content ILIKE %s
                            ORDER BY ST_Distance(posts2.geog, ST_MakePoint(%s,%s)) LIMIT 10 OFFSET %s""", ('%' + search_term + '%', loc["create-long"], loc["create-lat"],(page-1)*10))
        return cur.fetchall()
