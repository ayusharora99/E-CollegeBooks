import json

# Here go your api methods.
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
    return "ok" # Might be useful in debugging.

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
    return "ok" # Might be useful in debugging.


@auth.requires_signature()
def add_post():
    post_id = db.post.insert(
        post_title=request.vars.post_title,
        post_content=request.vars.post_content,
    )
    # We return the id of the new post, so we can insert it along all the others.
    return response.json(dict(post_id=post_id))


# def get_post_list():
#     results = []
#     sums = {}
#     print auth.user
#     if auth.user is None:
#         # Not logged in.
#         rows = db().select(db.post.ALL, orderby=~db.post.post_time)
#         for row in rows:
#             results.append(dict(
#                 id=row.id,
#                 post_title=row.post_title,
#                 post_content=row.post_content,
#                 post_author=row.post_author,
#                 like = False, # Anyway not used as the user is not logged in.
#                 rating = None, # As above
#             ))
#     else:
#         # Logged in.
#         rows = db().select(db.post.ALL, db.user_like.ALL, db.user_star.ALL, db.thumb.ALL,
#                             left=[
#                                 db.user_like.on((db.user_like.post_id == db.post.id) & (db.user_like.user_email == auth.user.email)),
#                                 db.user_star.on((db.user_star.post_id == db.post.id) & (db.user_star.user_email == auth.user.email)),
#                                 db.thumb.on((db.thumb.post_id == db.post.id) & (db.thumb.user_email == auth.user.email)),
#                             ],
#                             orderby=~db.post.post_time)
#         thumbs = db().select(db.thumb.ALL);
#         for item in thumbs:
#             if item.post_id not in sums:
#                 sums[int(item.post_id)] = 0
#             if item.thumb_state == "True":
#                 sums[int(item.post_id)] += 1
#             elif item.thumb_state == "False":
#                 sums[int(item.post_id)] -= 1;
#         for row in rows:
#             results.append(dict(
#                 id=row.post.id,
#                 post_title=row.post.post_title,
#                 post_content=row.post.post_content,
#                 post_author=row.post.post_author,
#                 like = False if row.user_like.id is None else True,
#                 rating = None if row.user_star.id is None else row.user_star.rating,
#                 upvoted = row.thumb.thumb_state == "True",
#                 downvoted = row.thumb.thumb_state == "False",
#                 score = sums[int(row.post.id)]
#             ))
#     # For homogeneity, we always return a dictionary.
#     return response.json(dict(post_list=results))

def get_post_list():
    results = []
    sums = {}
    if auth.user is None:
        thumbs_up = len(db((db.thumb.post_id == row.post.id) & (db.thumb.thumb_state == "True")).select())
        thumbs_down = len(db((db.thumb.post_id == row.post.id) & (db.thumb.thumb_state == "False")).select())
        post_score = thumbs_up - thumbs_down
        # Not logged in.
        rows = db().select(db.post.ALL, orderby=~db.post.post_time)
        for row in rows:
            results.append(dict(
                id=row.id,
                post_title=row.post_title,
                post_content=row.post_content,
                post_author=row.post_author,
                like = False, # Anyway not used as the user is not logged in. 
                rating = None, # As above
                score = post_score
            ))
    else:
        # Logged in.
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
    # For homogeneity, we always return a dictionary.
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
    return "ok" # Might be useful in debugging.

def get_likers():
    """Gets the list of people who liked a post."""
    post_id = int(request.vars.post_id)
    # We get directly the list of all the users who liked the post.
    rows = db(db.user_like.post_id == post_id).select(db.user_like.user_email)
    # If the user is logged in, we remove the user from the set.
    likers_set = set([r.user_email for r in rows])
    if auth.user:
        likers_set -= {auth.user.email}
    likers_list = list(likers_set)
    likers_list.sort()
    # We return this list as a dictionary field, to be consistent with all other calls.
    return response.json(dict(likers=likers_list))


def set_stars():
    """Sets the star rating of a post."""
    post_id = int(request.vars.post_id)
    rating = int(request.vars.rating)
    db.user_star.update_or_insert(
        (db.user_star.post_id == post_id) & (db.user_star.user_email == auth.user.email),
        post_id = post_id,
        user_email = auth.user.email,
        rating = rating
    )
    return "ok" # Might be useful in debugging.
