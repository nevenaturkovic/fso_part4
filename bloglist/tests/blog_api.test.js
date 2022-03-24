const mongoose = require("mongoose")
const supertest = require("supertest")
const helper = require("./test_helper")
const app = require("../app")
const api = supertest(app)

const Blog = require("../models/blog")

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

test("blogs are returned as json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/)
})

test("all blogs are returned", async () => {
  const response = await api.get("/api/blogs")

  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test("blogs have ids", async () => {
  const response = await api.get("/api/blogs")
  for (let blog of response.body) {
    expect(blog.id).toBeDefined()
  }
})

test("a valid blog can be added", async () => {
  const newBlog = {
    title: "React patterns",
    author: "Michael Chan",
    likes: 7,
  }

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const titles = blogsAtEnd.map((n) => n.title)
  expect(titles).toContain("React patterns")
})

test("likes default to 0 if missing", async () => {
  const newBlog = {
    title: "Likes missing",
    author: "Nevena Radovic",
  }

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const newBlogInDb = blogsAtEnd.find((blog) => blog.title === "Likes missing")
  expect(newBlogInDb.likes).toBe(0)
})

test("title and url missing, respose is 400", async () => {
  const newBlog = {
    author: "Nevena Radovic",
  }

  await api.post("/api/blogs").send(newBlog).expect(400)
})

test("deletion succeeds with status code 204 if id is valid", async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]

  await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

  const titles = blogsAtEnd.map((blog) => blog.title)

  expect(titles).not.toContain(blogToDelete.title)
})

test("modification succeeds for all fields", async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToUpdate = blogsAtStart[0]

  const modifiedBlog = {
    title: "Updated blogpost",
    author: "Updated author",
    url: "www.google.com",
    likes: 111,
  }
  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(modifiedBlog)
    .expect(200)
    .expect("Content-Type", /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

  const titles = blogsAtEnd.map((blog) => blog.title)

  expect(titles).toContain(modifiedBlog.title)
})

afterAll(() => {
  mongoose.connection.close()
})
