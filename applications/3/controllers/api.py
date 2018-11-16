# Here go your api methods.


@auth.requires_signature()
def add_post():
    post_id = db.post.insert(
        post_title=request.vars.post_title,
        post_content=request.vars.post_content,
    )
    # We return the id of the new post, so we can insert it along all the others.
    return response.json(dict(post_id=post_id))


def get_post_list():
    results = []
    if auth.user is None:
        # Not logged in.
        rows = db().select(db.post.ALL, orderby=~db.post.post_time)
        for row in rows:
            results.append(dict(
                id=row.id,
                post_title=row.post_title,
                post_content=row.post_content,
                post_author=row.post_author,
                thumb=None,
                thumb_count=0
            ))
    else:
        # Logged in.
        rows = db().select(db.post.ALL, db.thumb.ALL,
                            left=[
                                db.thumb.on((db.thumb.post_id == db.post.id) & (db.thumb.user_email == auth.user.email)),
                            ],
                            orderby=~db.post.post_time)
        for row in rows:
            results.append(dict(
                id=row.post.id,
                post_title=row.post.post_title,
                post_content=row.post.post_content,
                post_author=row.post.post_author,
                thumb = None if row.thumb.id is None else row.thumb.thumb_state,
                thumb_count = None if row.post.id is None else row.post.thumb_count,
            ))
    # For homogeneity, we always return a dictionary.
    return response.json(dict(post_list=results))
    
@auth.requires_signature()
def set_thumb():
    post_id = int(request.vars.post_id)
    thumb_state = request.vars.thumb_state
    db.thumb.update_or_insert(
        (db.thumb.post_id == post_id) & (db.thumb.user_email == auth.user.email),
        post_id = post_id,
        user_email = auth.user.email,
        thumb_state = thumb_state
    )
    return "ok thumb state updated" # Might be useful in debugging.

@auth.requires_signature()
def get_thumb_count():
    post_id = int(request.vars.post_id)
    rows = db(db.post.post_id == post_id).select()
    thumb_count = 0
    for r in rows:
        if r.thumb == 'u': 
            thumb_count += 1 
        elif r.thumb == 'd':
            thumb_count -= 1 

    # We return this list as a dictionary field, to be consistent with all other calls.
    return response.json(dict(thumb_count=thumb_count))
    return "ok thumb count updated" # Might be useful in debugging.
