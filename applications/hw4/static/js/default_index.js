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
        var price = self.vue.form_price;
        console.log(price);
        var condition = self.vue.form_condition;
        var category = self.vue.form_category;
        var edition = self.vue.form_edition;
        $.post(add_post_url,
            // Data we are sending.
            {
                post_title: self.vue.form_title,
                post_price: self.vue.form_price,
                post_condition: self.vue.form_condition,
                post_category: self.vue.form_category,
                post_edition: self.vue.form_edition
            },
            // What do we do when the post succeeds?
            function (data) {
                // Re-enable the button.
                $.web2py.enableElement($("#add-post"));
                // Clears the form.
                self.vue.form_title = "";
                self.vue.form_content = "";
                self.vue.form_price = "";
                self.vue.form_condition = "",
                self.vue.form_category = "",
                self.vue.form_edition = "";
                // Adds the post to the list of posts.
                var new_post = {
                    id: data.post_id,
                    post_title: sent_title,
                    post_price: price,
                    post_condition: condition,
                    post_category: category,
                    post_edition: edition,
                };
                self.vue.post_list.unshift(new_post);
                // We re-enumerate the array.
                self.process_posts();
            });
        // If you put code here, it is run BEFORE the call comes back.
    };

    self.get_posts = function(sortBy) {
        sortingDict = {
          Alphabetical: "post_title",
          Price: "post_price",
          Category: "post_category"

        }
        console.log(sortBy)
        if (!sortBy) {
          sortBy = "post_title"
        } else {
          sortBy = sortingDict[sortBy]
        }
        console.log(sortBy)
        $.post(get_post_list_url, {sortBy: sortBy},
            function(data) {
                // I am assuming here that the server gives me a nice list
                // of posts, all ready for display.
                self.vue.post_list = data.post_list;
                console.log(self.vue.post_list);
                self.vue.user = data.user;
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
        self.vue.post_list = self.vue.post_list.sort(function(a, b) {
            return a.post_category - b.post_category;
          })
        // We initialize the smile status to match the like.
        self.vue.post_list.map(function (e) {
            // I need to use Vue.set here, because I am adding a new watched attribute
            // to an object.  See https://vuejs.org/v2/guide/list.html#Object-Change-Detection-Caveats
            // The code below is commented out, as we don't have smiles any more.
            // Replace it with the appropriate code for thumbs.
            // // Did I like it?
            // // If I do e._smile = e.like, then Vue won't see the changes to e._smile .
            // Vue.set(e, '_smile', e.like);
            Vue.set(e, 'editing', false);
            Vue.set(e, 'showComments', false);
            Vue.set(e, 'comments', []);
            Vue.set(e, 'addingComment', false);
            Vue.set(e, 'newComment', '');
            Vue.set(e, 'commentEditing', false);
        });
    };

    self.delete_post = function(post_idx) {
        console.log(self.vue.post_list[post_idx].id);
        $.post(delete_post_url,{
            post_id: self.vue.post_list[post_idx].id});
        //Cheap window reload for now to get rid of post    
        location.reload();
    };

    self.editPost = function(post_idx) {
        var p = self.vue.post_list[post_idx];
        p.editing = true;
        editing = p.editing;
    }


    self.editComment = function(post_idx, comment_body, reply_author, id) {
        var p = self.vue.post_list[post_idx];
        console.log(id);
        for(var i = 0; i<p.comments.length; i++){
            p.comments[i].beingEdited = ((p.comments[i].body == comment_body) ? true : false)
        }
    }

    self.submitCommentEdit = function(post_idx, comment_body, reply_author, id) {
        var p = self.vue.post_list[post_idx];
        var newComment = document.getElementById("editcomment").value;
        self.vue.title_save_pending = true;
        for(var i = 0; i<p.comments.length; i++){
            if(p.comments[i].body == comment_body){
                $.post(edit_comment_url,
                {
                    id: id,
                    body: newComment
                },
                function (data) {
                    self.vue.title_save_pending = false;
                }
            );
                p.comments[i].body = newComment;
                p.comments[i].beingEdited = false;
            }
        }
    }

    self.submitEditPost = function(post_idx) {
        var p = self.vue.post_list[post_idx];
        var newText = document.getElementById("edittext").value;
        p.post_content = newText;
        var postBody = {
            post_id: p.id,
            post_title: p.post_title,
            post_content: newText
        }
        $.post(edit_post_url, postBody);
        p.editing = false;
    }

    self.hideComments = function(post_idx) {
        self.vue.post_list[post_idx].showComments = false;
    }

    self.showComments = function(post_idx) {
        var id = self.vue.post_list[post_idx].id;
        var p = self.vue.post_list[post_idx];
        for(var i = 0; i<p.comments.length; i++){
            p.comments[i].beingEdited = false;
            console.log(p.comments[i].beingEdited);
        }
        var url = getCommentsUrl + '?id=' + id;
        self.vue.post_list[post_idx].showComments = true;
        $.post(url, function(reponse){
            self.vue.post_list[post_idx].comments = reponse.comments;
        });
    }

    self.toggleAddingComment = function(post_idx) {
        self.vue.post_list[post_idx].addingComment = !self.vue.post_list[post_idx].addingComment;
    }

    self.saveComment = function(post_idx) {
        var newComment = {
            post_id: self.vue.post_list[post_idx].id,
            body: self.vue.post_list[post_idx].newComment,
        }
        $.post(saveCommentUrl, newComment, function(response){
            newComment['id'] = response.new_comment_id;
            self.vue.post_list[post_idx].comments.push(newComment);
        });
    }

    

    // Complete as needed.
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            form_title: "",
            form_content: "",
            form_price: "",
            form_condition: "",
            form_category: "",
            form_edition:"",
            form_sort: "",
            post_list: [],
            title_save_pending: false,
            user: null
        },
        methods: {
            add_post: self.add_post,
            editPost: self.editPost,
            submitEditPost: self.submitEditPost,
            hideComments: self.hideComments,
            showComments: self.showComments,
            toggleAddingComment: self.toggleAddingComment,
            saveComment: self.saveComment,
            editComment: self.editComment,
            submitCommentEdit: self.submitCommentEdit,
            sortPosts: self.sortPosts,
            get_posts: self.get_posts,
            delete_post: self.delete_post,
        }
    });

    // If we are logged in, shows the form to add posts.
    if (is_logged_in) {
        $("#add_post").show();
    }

    // Gets the posts.
    self.get_posts("Alphabetical");

    return self;
};

var APP = null;

// No, this would evaluate it too soon.
// var APP = app();

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x

//Function to show or hide add post
function show_hide_add_post() {
    var x = document.getElementById("show_add_post");
    var y = document.getElementById("show_hide_button");
    var z = document.getElementById("show_hide_button2");
    if (x.style.display === "none") {
        x.style.display = "block";
        y.style.display = "none";
        z.style.display = "block";
    } else {
        x.style.display = "none";
        y.style.display = "block";
        z.style.display = "none";
    }
}
jQuery(function(){APP = app();});
