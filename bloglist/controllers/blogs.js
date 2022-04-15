const blogsRouter = require("express").Router()
const Blog = require("../models/blog")
const User = require("../models/user")

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 })

  response.json(blogs)
})

blogsRouter.post("/", async (request, response) => {
  const body = request.body
  const user = request.user

  if (user) {
    if (!body.title && !body.url) {
      response.status(400).end()
      return
    }

    const blog = new Blog({
      url: body.url,
      title: body.title,
      author: body.author,
      user: user._id,
      likes: body.likes || 0,
    })

    const savedBlog = await blog.save()
    blog.populate("user", { username: 1, name: 1 })

    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.status(201).json(savedBlog)
  } else {
    response.status(401).end()
    return
  }
})

blogsRouter.delete("/:id", async (request, response) => {
  const user = request.user
  if (user) {
    const blog = await Blog.findById(request.params.id)
    if (blog.user.toString() === user._id.toString()) {
      await Blog.findByIdAndRemove(request.params.id)
    } else {
      return response
        .status(401)
        .json({ error: "only the author can delete a blogpost" })
    }
    response.status(204).end()
  } else {
    response.status(401).end()
    return
  }
})

blogsRouter.put("/:id", async (request, response, next) => {
  const body = request.body

  const blog = {}

  if (request.body.title) {
    blog.title = request.body.title
  }
  if (request.body.author) {
    blog.author = request.body.author
  }
  if (request.body.likes) {
    blog.likes = request.body.likes
  }

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
  }).populate("user", { username: 1, name: 1 })
  response.json(updatedBlog)
})

module.exports = blogsRouter
