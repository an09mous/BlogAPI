const express = require("express");
const mongoose = require("mongoose");
const Blog = require("./models/blog");

const app = express();
const port = process.env.PORT || 3000;
const dbUriPrefix = "mongodb+srv://an09mous:";
const dbPassword = "an09mous";
const dbUriSuffix = "@cluster0.is84r.mongodb.net/blogsDB?retryWrites=true&w=majority";

app.use(express.json()); //To Parse JSON Body

//Connecting to DB and then start listening
mongoose.connect(dbUriPrefix + dbPassword + dbUriSuffix, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => app.listen(port, () => console.log(`Listening on port ${port}...`)))
.catch((err) => console.log(err));

app.get("/api/blogs", (req, res) => {
    if(req.query.sortBy) {
        switch(req.query.sortBy) {
            case "title": 
                Blog.find()
                    .sort({title: 1})
                    .then((blogs) => res.send(blogs))
                    .catch((err) => console.log(err));
                break;
            case "time":
                Blog.find()
                    .sort({createdAt: 1})
                    .then((blogs) => res.send(blogs))
                    .catch((err) => console.log(err));
                break;
            default:
                res.status(400).send("Invalid sorting filter");
        };
    }
    else if(req.query.author) {
        Blog.findOne({author: req.query.author})
            .then((blog) => res.send(blog))
            .catch((err) => console.log(err));
    }
    else {
        Blog.find()
            .then((blogs) => res.send(blogs))
            .catch((err) => console.log(err));
    }
});

app.get("/api/blogs/:id", validateId, (req, res) => {
    Blog.findById(req.params.id)
        .then((blog) => {
            if(blog) {
                res.send(blog);
            }
            else {
                res.status(404).send("Blog not found");
            }
        })
        .catch((err) => console.log(err));
})

app.post("/api/blogs", (req, res) => {
    const blog = new Blog({
        ...req.body,
    });

    blog.save()
        .then((result) => res.send(result))
        .catch((err) => {
            console.log(err);
            res.status(400).send(err.errors.title.properties.message);
        });
});

//PUT is used to replace an existing resource entirely (Overwrites)
app.put("/api/blogs/:id", validateId, (req, res) => {
    Blog.findOneAndReplace(
        {_id: req.params.id},
        req.body,
        {new: true}
    )
    .then((result) => {
        if(result) {
            res.send(result);
        }
        else {
            res.status(404).send("Blog not found");
        }
    })
    .catch((err) => {
        console.log(err);
        res.status(400).send(err.errors.title.properties.message);
    });
});

//Update some fields of a particular document
app.patch("/api/blogs/:id", validateId, (req, res) => {
    Blog.findByIdAndUpdate(
        req.params.id,
        req.body,
        {new: true,
        useFindAndModify: false}
    )
    .then((result) => {
        if(result) {
            res.send(result);
        }
        else {
            res.status(404).send("Blog not found");
        }
    })
    .catch((err) => {
        console.log(err);
        res.status(400).send(err.errors.title.properties.message);
    });
});

app.delete("/api/blogs/:id", validateId, (req, res) => {
    Blog.findByIdAndDelete(req.params.id)
        .then((result) => {
            if(result) {
                res.send(result);
            }
            else {
                res.status(404).send("Blog not found");
            }
        })
        .catch((err) => console.log(err));
});

function validateId(req, res, next) {
    //Validate id
    const hex = /[0-9A-Fa-f]{6}/g;
    if(req.params.id.length != 24 || !hex.test(req.params.id)) {
        res.status(404).send("Invalid id");
    }
    else {
        next();
    }
}