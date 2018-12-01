
var app = function() {
    var form_show = true;
    var self = {};

    Vue.config.silent = false;
    
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    var enumerate = function(v) { var k=0; return v.map(function(e) {e._idx = k++;});};

    self.add_post = function () {

        $.web2py.disableElement($("#add-post"));
        var sent_title = self.vue.form_title;
        var sent_content = self.vue.form_content;
        $.post(add_post_url,

            {
                post_title: self.vue.form_title,
                post_content: self.vue.form_content
            },

            function (data) {
                $.web2py.enableElement($("#add-post"));
                self.vue.form_title = "";
                self.vue.form_content = "";
                var new_post = {
                    id: data.post_id,
                    post_title: sent_title,
                    post_content: sent_content
                };
                self.vue.post_list.unshift(new_post);
                self.process_posts();
            });

    };

    self.get_posts = function() {
        $.getJSON(get_post_list_url,
            function(data) {

                self.vue.post_list = data.post_list;

                self.process_posts();
                console.log("I got my list: ", data.post_list);
            }
        );
        console.log("I fired the get");
    };

    self.process_posts = function() {

        enumerate(self.vue.post_list);

        self.vue.post_list.map(function (e) {


            Vue.set(e, '_score', e.score);
            Vue.set(e, '_downvoted', e.downvoted);
            Vue.set(e, '_upvoted', e.upvoted);

        });
    };

    self.upvote_mouseover = function (post_idx) {

        var p = self.vue.post_list[post_idx];
        p._upvoted = !p.upvoted;
    };

    self.downvote_mouseover = function (post_idx) {

        var p = self.vue.post_list[post_idx];
        p._downvoted = !p.downvoted;
    };

    self.upvote = function (post_idx) {

        var p = self.vue.post_list[post_idx];
        if (p.upvoted == true) {
          p.upvoted = null;
          p._score = p._score - 1
        } else {
          p.upvoted = true
          p._score = p._score + 1
        }
        p.downvoted = false

        $.post(set_upvote_url, {
            post_id: p.id,
            like: p.like,
            upvoted: p.upvoted,
            downvoted: p.downvoted
        });
    };

    self.downvote = function (post_idx) {

        var p = self.vue.post_list[post_idx];
        if (p.downvoted == true) {
          p.downvoted = null;
          p._score = p._score + 1
        } else {
          p.downvoted = true
          p._score = p._score - 1
        }
        p.upvoted = false

        $.post(set_downvote_url, {
            post_id: p.id,
            like: p.like,
            downvoted: p.downvoted,
            upvoted: p.upvoted
        });
    };

    self.like_mouseout = function (post_idx) {

        var p = self.vue.post_list[post_idx];
        p._upvoted = p.upvoted;
        p._downvoted = p.downvoted;
    };

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
            like_mouseover: self.like_mouseover,
            like_mouseout: self.like_mouseout,
            like_click: self.like_click,
            upvote_mouseover: self.upvote_mouseover,
            downvote_mouseover: self.downvote_mouseover,
            downvote: self.downvote,
            upvote: self.upvote,
        }
    });

    if (is_logged_in) {
        $("#add_post").show();
    }
    self.get_posts();
    return self;
};

var APP = null;
jQuery(function(){APP = app();});
