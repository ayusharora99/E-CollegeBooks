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

        self.vue.show_form = !self.vue.show_form;

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
        // We initialize the smile status to match the like. 
        self.vue.post_list.map(function (e) {
            // I need to use Vue.set here, because I am adding a new watched attribute
            // to an object.  See https://vuejs.org/v2/guide/list.html#Object-Change-Detection-Caveats
            // The code below is commented out, as we don't have smiles any more. 
            // Replace it with the appropriate code for thumbs. 
            // // Did I like it? 
            // // If I do e._smile = e.like, then Vue won't see the changes to e._smile . 
            Vue.set(e, '_thumb', e.thumb_state); 
            Vue.set(e, '_thumb_count', e.thumb_count);
        });
    };

    self.thumb_click = function (post_idx, new_thumb_state) {
        // The thumb status is toggled; the UI is not changed.
        var p = self.vue.post_list[post_idx];
        var thumb_state = new_thumb_state;
        // if thumb has the same value, we want to de-select it so we set the new thumb state to null
        if(p.thumb == new_thumb_state) {
            p.thumb = null;
            thumb_state = undefined;
        }
        else{
            p.thumb = new_thumb_state;
        }   
        // We need to post back the change to the server.
        $.post(set_thumb_url, {
            post_id: p.id,
            thumb_state: thumb_state
        }); // Nothing to do upon completion.
    };

    self.thumb_mouseover = function (post_idx, thumb_state) {
        // When we mouse over something, the thumb has to assume the opposite
        // of the current state, to indicate the effect.
        var p = self.vue.post_list[post_idx];
        p.thumb = thumb_state;
    };

    self.thumb_mouseout = function (post_idx) {
        var p = self.vue.post_list[post_idx];
        p._thumb = p.thumb_state;
    };

     // Code for getting and displaying thumb count
    self.show_thumb_count = function(post_idx) {
        var p = self.vue.post_list[post_idx];
        var thumb_count = p._thumb_count
        $.getJSON(thumb_count_url,{
            post_id: p.id,
            thumb_count: thumb_count
        });
    };

    self.add_post_button = function() {
        self.vue.show_form = !self.vue.show_form;

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
            show_form: false,

        },
        methods: {
            add_post: self.add_post,
            thumb_click: self.thumb_click,
            thumb_mouseover: self.thumb_mouseover,
            show_thumb_count: self.show_thumb_count,
            add_post_button: self.add_post_button
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
