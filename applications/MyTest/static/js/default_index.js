// This is the js for the default/index.html view.
var app = function() {
    var form_show = true;
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
            }
        );
        console.log("I fired the get");
    };

    self.process_posts = function() {
        // This function is used to post-process posts, after the list has been modified
        // or after we have gotten new posts.
        // We add the _idx attribute to the posts.
        enumerate(self.vue.post_list);
        // We initialize the smile status to match the like.
        self.vue.post_list.map(function (e) {

            // I need to use Vue.set here, because I am adding a new watched attribute
            // to an object.  See https://vuejs.org/v2/guide/list.html#Object-Change-Detection-Caveats
            // Did I like it?
            // If I do e._smile = e.like, then Vue won't see the changes to e._smile .
            // Vue.set(e, '_upvoted', e.upvoted);
            // Vue.set(e, '_downvoted', e.downvoted);
            //Vue.set(e, '_upvote', e.upvote);
            Vue.set(e, '_score', e.score);
            Vue.set(e, '_downvoted', e.downvoted);
            Vue.set(e, '_upvoted', e.upvoted);
            Vue.set(e, '_smile', e.like);
            // Who liked it?
            Vue.set(e, '_likers', []);
            // Do I know who liked it? (This could also be a timestamp to limit refresh)
            Vue.set(e, '_likers_known', false);
            // Do I show who liked?
            Vue.set(e, '_show_likers', false);
            // Number of stars to display.
            Vue.set(e, '_num_stars_display', e.rating);
        });
    };

    self.upvote_mouseover = function (post_idx) {
        // When we mouse over something, the face has to assume the opposite
        // of the current state, to indicate the effect.
        var p = self.vue.post_list[post_idx];
        p._upvoted = !p.upvoted;
    };

    self.downvote_mouseover = function (post_idx) {
        // When we mouse over something, the face has to assume the opposite
        // of the current state, to indicate the effect.
        var p = self.vue.post_list[post_idx];
        p._downvoted = !p.downvoted;
    };



    self.upvote = function (post_idx) {
        // The like status is toggled; the UI is not changed.
        var p = self.vue.post_list[post_idx];
        if (p.upvoted == true) {
          p.upvoted = null;
        } else {
          p.upvoted = true
        }
        p.downvoted = false
        // We need to post back the change to the server.
        $.post(set_upvote_url, {
            post_id: p.id,
            like: p.like,
            upvoted: p.upvoted,
            downvoted: p.downvoted
        }); // Nothing to do upon completion.
    };

    self.downvote = function (post_idx) {
        // The like status is toggled; the UI is not changed.
        var p = self.vue.post_list[post_idx];
        if (p.downvoted == true) {
          p.downvoted = null;
        } else {
          p.downvoted = true
        }
        p.upvoted = false
        // We need to post back the change to the server.
        $.post(set_downvote_url, {
            post_id: p.id,
            like: p.like,
            downvote: p.downvote,
            upvoted: p.upvoted
        }); // Nothing to do upon completion.
    };

    self.like_mouseout = function (post_idx) {
        // The like and smile status coincide again.
        var p = self.vue.post_list[post_idx];
        p._upvoted = p.upvoted;
        p._downvoted = p.downvoted;
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
            star_indices: [1, 2, 3, 4, 5]
        },
        methods: {
            add_post: self.add_post,
            // Likers.
            like_mouseover: self.like_mouseover,
            like_mouseout: self.like_mouseout,
            like_click: self.like_click,
            upvote_mouseover: self.upvote_mouseover,
            downvote_mouseover: self.downvote_mouseover,
            downvote: self.downvote,
            upvote: self.upvote,
            // Show/hide who liked.
            show_likers: self.show_likers,
            hide_likers: self.hide_likers,
            // Star ratings.
            stars_out: self.stars_out,
            stars_over: self.stars_over,
            set_stars: self.set_stars
        }

    });

    // If we are logged in, shows the form to add posts.
    if (is_logged_in) {
        $("#add_post").show();
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
