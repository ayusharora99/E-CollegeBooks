import json

@auth.requires_signature()
def set_upvote():
    post_id = int(request.vars.post_id)
    upvoted = request.vars.upvoted.lower().startswith('t');
    print upvoted
    if upvoted:
        db.thumb.update_or_insert(
        (db.thumb.post_id == post_id) & (db.thumb.user_email == auth.user.email),
        post_id = post_id,
        user_email = auth.user.email,
        thumb_state = True
        )
    else:
        db((db.thumb.post_id == post_id) & (db.thumb.user_email == auth.user.email)).delete()
    return "ok"

@auth.requires_signature()
def set_downvote():
    post_id = int(request.vars.post_id)
    downvoted = request.vars.downvoted.lower().startswith('t');
    print downvoted
    if downvoted:
        db.thumb.update_or_insert(
        (db.thumb.post_id == post_id) & (db.thumb.user_email == auth.user.email),
        post_id = post_id,
        user_email = auth.user.email,
        thumb_state = False
        )
    else:
        db((db.thumb.post_id == post_id) & (db.thumb.user_email == auth.user.email)).delete()
    return "ok"

@auth.requires_signature()
def add_post():
    post_id = db.post.insert(
        post_title=request.vars.post_title,
        post_content=request.vars.post_content,
    )

    return response.json(dict(post_id=post_id))

def get_post_list():
    results = []
    sums = {}
    if auth.user is None:
        thumbs_up = len(db((db.thumb.post_id == row.post.id) & (db.thumb.thumb_state == "True")).select())
        thumbs_down = len(db((db.thumb.post_id == row.post.id) & (db.thumb.thumb_state == "False")).select())
        post_score = thumbs_up - thumbs_down
        rows = db().select(db.post.ALL, orderby=~db.post.post_time)
        for row in rows:
            results.append(dict(
                id=row.id,
                post_title=row.post_title,
                post_content=row.post_content,
                post_author=row.post_author,
                like = False,
                rating = None,
                score = post_score
            ))
    else:

        rows = db().select(db.post.ALL, db.user_like.ALL, db.user_star.ALL, db.thumb.ALL,
                            left=[
                                db.user_like.on((db.user_like.post_id == db.post.id) & (db.user_like.user_email == auth.user.email)),
                                db.user_star.on((db.user_star.post_id == db.post.id) & (db.user_star.user_email == auth.user.email)),
                                db.thumb.on((db.thumb.post_id == db.post.id) & (db.thumb.user_email == auth.user.email)),
                            ],
                            orderby=~db.post.post_time)
        thumbs = db().select(db.thumb.ALL);
        print(thumbs)
        for item in thumbs:
            if item.post_id not in sums:
                sums[int(item.post_id)] = 0
            if item.thumb_state == "True":
                sums[int(item.post_id)] += 1
            elif item.thumb_state == "False":
                sums[int(item.post_id)] -= 1
        for row in rows:
            thumbs_up = len(db((db.thumb.post_id == row.post.id) & (db.thumb.thumb_state == "True")).select())
            thumbs_down = len(db((db.thumb.post_id == row.post.id) & (db.thumb.thumb_state == "False")).select())
            post_score = thumbs_up - thumbs_down
            print("post score",post_score)
            results.append(dict(
                id=row.post.id,
                post_title=row.post.post_title,
                post_content=row.post.post_content,
                post_author=row.post.post_author,
                like = False if row.user_like.id is None else True,
                rating = None if row.user_star.id is None else row.user_star.rating,
                upvoted = row.thumb.thumb_state == "True",
                downvoted = row.thumb.thumb_state == "False",
                score = post_score
            ))

    return response.json(dict(post_list=results))

@auth.requires_signature()
def set_like():
    post_id = int(request.vars.post_id)
    like_status = request.vars.like.lower().startswith('t');
    upvoted = request.vars.upvoted.lower().startswith('t');
    print upvoted
    if upvoted:
        db.thumb.update_or_insert(
        (db.thumb.post_id == post_id) & (db.thumb.user_email == auth.user.email),
        post_id = post_id,
        user_email = auth.user.email,
        thumb_state = True
        )
    else:
        db((db.thumb.post_id == post_id) & (db.thumb.user_email == auth.user.email)).delete()
    return "ok"
