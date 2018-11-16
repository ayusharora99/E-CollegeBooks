// This is the js for the default/index.html view.
var app = function() {

    var self = {};

    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    // Enumerates an array.
    var enumerate = function(v) { var k=0; return v.map(function(e) {e._idx = k++;});};
    
    self.add_button = function() {
        $("#add_button").hide();
        $("#add_post").show();
    }
    
    self.add_post = function () {
        // We disable the button, to prevent double submission.
        $.web2py.disableElement($("#add-post"));
        var sent_title = self.vue.form_title; // Makes a copy 
        var sent_content = self.vue.form_content; // 
        $.post(add_post_url,
            // Data we are sending.
            {
                post_title: self.vue.form_title,
                post_content: self.vue.form_content
            },
            // What do we do when the post succeeds?
            function (data) {
                // Re-enable the button.
                $.web2py.enableElement($("#add-post"));
                // Clears the form.
                self.vue.form_title = "";
                self.vue.form_content = "";
                // Adds the post to the list of posts. 
                var new_post = {
                    id: data.post_id,
                    post_title: sent_title,
                    post_content: sent_content
                };
                self.vue.post_list.unshift(new_post);
                // We re-enumerate the array.
                self.process_posts();
            });
        $("#add_post").hide();
        $("#add_button").show();
        // If you put code here, it is run BEFORE the call comes back.
    };

    self.get_posts = function() {
        $.getJSON(get_post_list_url,
            function(data) {
                // I am assuming here that the server gives me a nice list
                // of posts, all ready for display.
                self.vue.post_list = data.post_list;
                // Post-processing.
                self.process_posts();
                console.log("I got my list");
            }
        );
        console.log("I fired the get");
    };

    self.process_posts = function() {
        // This function is used to post-process posts, after the list has been modified
        // or after we have gotten new posts. 
        // We add the _idx attribute to the posts. 
        enumerate(self.vue.post_list);
        // We initialize the up status to match the like. 
        self.vue.post_list.map(function (e) {
            // I need to use Vue.set here, because I am adding a new watched attribute
            // to an object.  See https://vuejs.org/v2/guide/list.html#Object-Change-Detection-Caveats
            // Did I like it? 
            // If I do e._up = e.like, then Vue won't see the changes to e._up . 
            Vue.set(e, '_up', e.like); 
            Vue.set(e, '_down', e.dislike); 
            // Who liked it?
            Vue.set(e, '_likers', 0);
            Vue.set(e, '_dislikers', 0);
            Vue.set(e, '_count', 0);
            // Do I know who liked it? (This could also be a timestamp to limit refresh)
            Vue.set(e, '_likers_known', false);
            Vue.set(e, '_dislikers_known', false);
            // Do I show who liked? 
            Vue.set(e, '_show_likers', false);
            Vue.set(e, '_show_dislikers', false);
            Vue.set(e, '_show_count', false);
            
            //get count data
            if (!e._likers_known) {
                $.getJSON(get_likers_url, {post_id: e.id}, function (data) {
                    e._likers = data.likers.length
                    e._likers_known = true;
                    if (!e._dislikers_known) {
                        $.getJSON(get_dislikers_url, {post_id: e.id}, function (data) {
                            e._dislikers = data.dislikers.length
                            e._dislikers_known = true;
                            e._count = e.like ? 1 : e.dislike ? -1 : 0; 
                            e._count += (e._likers - e._dislikers);
                            e._show_count = true;
                        })
                    }
                })
            }
        });
    };

    // Up change code. 
    self.like_mouseover = function (post_idx) {
        // When we mouse over something, the face has to assume the opposite
        // of the current state, to indicate the effect.
        var p = self.vue.post_list[post_idx];
        if(!p.like){
            p._up = !p.like;
            if(p.dislike){p._down = !p.dislike;}
        }
    };

    self.like_click = function (post_idx) {
        // The like status is toggled; the UI is not changed.
        var p = self.vue.post_list[post_idx];
        if(p.dislike){
            p.dislike = p.like;
            $.post(set_dislike_url, {
                post_id: p.id,
                dislike: p.dislike
            });
            //self.dislike_mouseout(post_idx);
        }
        p.like = !p.like;
        // We need to post back the change to the server.
        $.post(set_like_url, {
            post_id: p.id,
            like: p.like
        }); // Nothing to do upon completion.
    };

    self.like_mouseout = function (post_idx) {
        // The like and up status coincide again.
        var p = self.vue.post_list[post_idx];
        p._up = p.like;
        if(p._down != p.dislike){ p._down = p.dislike;}
    };
    
    self.show_count = function(post_idx) {
        var p = self.vue.post_list[post_idx];
        //p._show_likers = true;
        if (!p._likers_known) {
            $.getJSON(get_likers_url, {post_id: p.id}, function (data) {
                p._likers = data.likers.length
                p._likers_known = true;
            })
        }
        //p._show_dislikers = true;
        if (!p._dislikers_known) {
            $.getJSON(get_dislikers_url, {post_id: p.id}, function (data) {
                p._dislikers = data.dislikers.length
                p._dislikers_known = true;
            })
        }
        if(p._likers_known && p._dislikers_known){
             p._count = (p.like ? 1 : p.dislike ? -1 : 0) + (p._likers - p._dislikers);
             p._show_count = true;
        }
    };

    // Up change code. 
    self.dislike_mouseover = function (post_idx) {
        // When we mouse over something, the face has to assume the opposite
        // of the current state, to indicate the effect.
        var p = self.vue.post_list[post_idx];
        if(!p.dislike){
            p._down = !p.dislike;
            if(p.like){p._up = !p.like;}
        }
    };

    self.dislike_click = function (post_idx) {
        // The like status is toggled; the UI is not changed.
        var p = self.vue.post_list[post_idx];
        if(p.like){
            p.like = p.dislike;
            $.post(set_like_url, {
                post_id: p.id,
                like: p.like
            });
            //self.like_mouseout(post_idx);
        }
        p.dislike = !p.dislike;
        // We need to post back the change to the server.
        $.post(set_dislike_url, {
            post_id: p.id,
            dislike: p.dislike
        }); // Nothing to do upon completion.
    };

    self.dislike_mouseout = function (post_idx) {
        // The like and up status coincide again.
        var p = self.vue.post_list[post_idx];
        p._down = p.dislike;
        if(p._up != p.like){ p._up = p.like;}
    };

    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            form_title: "",
            form_content: "",
            post_list: [],
            is_logged_in: is_logged_in
        },
        methods: {
            add_button: self.add_button,
            add_post: self.add_post,
            // Likers. 
            like_mouseover: self.like_mouseover,
            like_mouseout: self.like_mouseout,
            like_click: self.like_click,
            // Show/hide who liked.
            show_likers: self.show_likers,
            hide_likers: self.hide_likers,
            show_count: self.show_count,
            // Dislikers. 
            dislike_mouseover: self.dislike_mouseover,
            dislike_mouseout: self.dislike_mouseout,
            dislike_click: self.dislike_click,
            // Show/hide who disliked.
            show_dislikers: self.show_dislikers,
            hide_dislikers: self.hide_dislikers
        }
    });

    // If we are logged in, shows the form to add posts.
    if (is_logged_in) {
        $("#add_button").show();
    }

    // Gets the posts.
    self.get_posts();

    return self;
};

var APP = null;

// No, this would evaluate it too soon.
// var APP = app();

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
