create table posts2 (
    id serial primary key,
    user_id int not null,
    content varchar(256),
    img bytea,
    geog geography(point,4326) not null,
    time timestamp with time zone not null default current_timestamp,
    foreign key (user_id) references users (id)
);

create table users (
    id serial primary key,
    name text not null,
    email text not null,
    img text not null,
);

insert into users (name, email, img) values (%s,%s,%s);


insert into posts2 (user_id, content, img, geog) 
values (%s, %s, %s, ST_MakePoint(%s,%s)),
(id, fd["create-text"], imgBin, fd["create-long"], fd["create-lat"])


update users set name = %s, img = %s where email = %s;


select 
    posts2.id,
    posts2.user_id,
    posts2.content,
    encode(posts2.img::bytea, 'base64') as "img",
    (ST_X(ST_AsText(posts2.geog)), ST_Y(ST_AsText(posts2.geog))) as "geog",
    posts2.time,
    users.name,
    users.img as user_img 
from posts2 
inner join users on posts2.user_id=users.id 
order by posts2.time desc;


select 
    posts2.id,
    posts2.user_id,
    posts2.content,
    encode(posts2.img::bytea, 'base64') as "img",
    (ST_X(ST_AsText(posts2.geog)), ST_Y(ST_AsText(posts2.geog))) as "geog",
    posts2.time,
    users.name,
    users.img as user_img 
from posts2 
inner join users on posts2.user_id=users.id 
order by ST_Distance(posts2.geog,ST_MakePoint(%s,%s));


select count(*) from posts2 
inner join users on posts2.user_id=users.id;