# Define your tables below (or better in another model file) for example
#
# >>> db.define_table('mytable', Field('myfield', 'string'))
#
# Fields can be 'string','text','password','integer','double','boolean'
#       'date','time','datetime','blob','upload', 'reference TABLENAME'
# There is an implicit 'id integer autoincrement' field
# Consult manual for more options, validators, etc.

# logger.info("The user record is: %r" % auth.user)

import datetime

def get_user_email():
    return None if auth.user is None else auth.user.email

def get_current_time():
    return datetime.datetime.utcnow()

db.define_table('post',
                Field('post_author', default=get_user_email()),
                Field('post_title'),
                Field('post_content', 'text'),
                Field('post_time', 'datetime', update=get_current_time()),
                )

db.post.post_time.readable = db.post.post_time.writable = False
db.post.post_author.writable = False
db.post.id.readable = False
# after defining tables, uncomment below to enable auditing
# auth.enable_record_versioning(db)

# Replies

db.define_table('reply',
                Field('post_id', 'reference post'),
                Field('reply_author', default=get_user_email()),
                Field('reply_content', 'text'),
                Field('reply_time', 'datetime', update=get_current_time())
                )