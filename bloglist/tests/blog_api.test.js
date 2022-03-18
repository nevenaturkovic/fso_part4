const mongoose = require("mongoose")
const supertest = require("supertest")
const helper = require("./test_helper")
const app = require("../app")
const api = supertest(app)
const Blog = require("../models/blog")

beforeEach(async () => {
  await Blog.deleteMany({})

  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog(blog)
    await blogObject.save()
  }
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

afterAll(() => {
  mongoose.connection.close()
})
