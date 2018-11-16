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
    var enumerate = function(v) {
        var k=0;
        return v.map(function(e) {
            e._idx = k++;
        });
    };
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
        hide();
    };

    self.get_thumbs = function(){
        var length = self.vue.post_list.length;
        posts = self.vue.post_list
        for(var i = 0; i < length; i++){
            var p = posts[i];
            console.log(p.id);
            console.log(p);
            $.post(get_thumbs_url, { post_id: p.id }, function (data) {
                p._total = data.total;
            });
        }
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
                self.get_thumbs();
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
            // Vue.set(e, '_smile', e.like);
            Vue.set(e, '_total'); //keeps track of total likes vs dislikes
            Vue.set(e, '_gray_thumb'); //keeps track of when thumbs are supposed to be gray
            Vue.set(e, '_num_thumb_display'); //keeps track of thumbs while hoverings
        });
    };

    self.total = function(p){
        $.post(get_thumbs_url, { post_id: p.id }, function (data) {
            p._total = data.total;
        })
    };

    self.thumbs_up_over = function(post_idx, thumbs_up_idx) {
        var p = self.vue.post_list[post_idx];
        console.log(p, thumbs_up_idx);
        console.log(p.thumb);
        if(p.thumb === 'd'){
            p._gray_thumb = 'u';
        }
        else if(p.thumb === 'u'){
            p._num_thumb_display = 'u';
            p._gray_thumb = 'd';
        }
        else{
            p._gray_thumb = 'u';
        }
    };

    self.thumbs_down_over = function(post_idx, thumbs_down_idx) {
        var p = self.vue.post_list[post_idx];
        console.log(p, thumbs_down_idx);
        console.log(p.thumb);
        if(p.thumb === 'u'){
            p._gray_thumb = 'd';
        }
        else if(p.thumb === 'd'){
            p._num_thumb_display = 'd';
            p._gray_thumb = 'u';
        }
        else{
            p._gray_thumb = 'd';
        }
    };

    self.thumbs_up_out = function(post_idx, thumbs_up_idx) {
        var p = self.vue.post_list[post_idx];
        console.log(p, thumbs_up_idx);
        self.vue.thumbs_up_state = false;
        p._num_thumb_display = p.thumb;
        p._gray_thumb = 'null';
    };

    self.thumbs_down_out = function(post_idx, thumbs_downdown_idx) {
        var p = self.vue.post_list[post_idx];
        self.vue.thumbs_down_state = false;
        p._num_thumb_display = p.thumb;
        p._gray_thumb = null;
    };

    self.show = function(){
        if(self.vue.isHidden){
            self.vue.isHidden = false;
        }
        if (is_logged_in && !self.vue.isHidden) {
            $(".add_posts").show();
            $(".add_post_button").hide();
        }
    };

    function hide(){
        if(!self.vue.isHidden){
            self.vue.isHidden = true;
        }
        if (is_logged_in && self.vue.isHidden) {
            $(".add_posts").hide();
            $(".add_post_button").show();
        }
    };
    // thumb keeps track of the gray thumb
    // vote confirms which thumb has been clicked
    self.set_thumb = function(post_idx, thumb, vote) {
        // The user has set this as the number of stars for the post.
        var p = self.vue.post_list[post_idx];
        if(thumb === 'u' && p._num_thumb_display === 'd' && vote === 'down'){
            p.thumb = null;
            // p._num_thumbs_down--;
            console.log('when black thumbs down clicked');
        }
        else if(thumb === 'd' && p._num_thumb_display === 'u' && vote === 'up'){
            p.thumb = null;
            // p._num_thumbs_up--;
            console.log('when black thumbs up clicked');
        }
        else{
            p.thumb = thumb;
        }
        // Sends the rating to the server.
        $.post(set_thumb_url, {
            post_id: p.id,
            thumb: p.thumb
        }, function(){
            self.total(p);
        });
    };

    // Complete as needed.
    self.vue = new Vue({
        el: "#vuediv",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            form_title: "",
            form_content: "",
            post_list: [],
            thumbs_list: [],
            isHidden: true
        },
        // computed:{
        //
        // },
        methods: {
            add_post: self.add_post,
            show: self.show,
            thumbs_up_over: self.thumbs_up_over,
            thumbs_down_over: self.thumbs_down_over,
            thumbs_up_out: self.thumbs_up_out,
            thumbs_down_out: self.thumbs_down_out,
            set_thumb: self.set_thumb,
        }

    });

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
