const mongoose = require("mongoose")
const supertest = require("supertest")
const helper = require("./test_helper")
const app = require("../app")
const api = supertest(app)

const Blog = require("../models/blog")
const bcrypt = require("bcrypt")
const User = require("../models/user")

var token
var token2
var blogId

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)

  // clean up the whole database
  await User.deleteMany({})

  // create a test user
  await api
    .post("/api/users")
    .send({
      username: "mluukkai",
      name: "Matti Luukkainen",
      password: "salainen",
    })
    .expect(201)
    .expect("Content-Type", /application\/json/)

  // get and save token for test user
  const res = await api
    .post("/api/login")
    .send({ username: "mluukkai", password: "salainen" })
    .expect(200)
    .expect("Content-Type", /application\/json/)

  token = res.body.token

  // create blog with user we've just created
  const blog = await api
    .post("/api/blogs")
    .set({ Authorization: `bearer ${token}` })
    .send({
      title: "A blog to test deletion",
      author: "Michael Chan",
      likes: 7,
    })
    .expect(201)
    .expect("Content-Type", /application\/json/)

  blogId = blog.body.id

  // create another test user
  await api
    .post("/api/users")
    .send({
      username: "ljubica",
      name: "Ljuta Ljuba",
      password: "passwoordd",
    })
    .expect(201)
    .expect("Content-Type", /application\/json/)

  // get and save token for test user
  const res2 = await api
    .post("/api/login")
    .send({ username: "ljubica", password: "passwoordd" })
    .expect(200)
    .expect("Content-Type", /application\/json/)

  token2 = res2.body.token
})

describe("when we include a valid token", () => {
  test("a valid blog can be added", async () => {
    const blogsAtStart = await helper.blogsInDb()

    const newBlog = {
      title: "React patterns",
      author: "Michael Chan",
      likes: 7,
    }

    await api
      .post("/api/blogs")
      .set({ Authorization: `bearer ${token}` })
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length + 1)

    const titles = blogsAtEnd.map((n) => n.title)
    expect(titles).toContain("React patterns")
  })

  test("likes default to 0 if missing", async () => {
    const blogsAtStart = await helper.blogsInDb()

    const newBlog = {
      title: "Likes missing",
      author: "Nevena Radovic",
    }

    await api
      .post("/api/blogs")
      .set({ Authorization: `bearer ${token}` })
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length + 1)

    const newBlogInDb = blogsAtEnd.find(
      (blog) => blog.title === "Likes missing"
    )
    expect(newBlogInDb.likes).toBe(0)
  })

  test("deletion succeeds with status code 204 if id is valid", async () => {
    await api
      .delete(`/api/blogs/${blogId}`)
      .set({ Authorization: `bearer ${token}` })
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    const titles = blogsAtEnd.map((blog) => blog.title)

    expect(titles).not.toContain("A blog to test deletion")
  })

  test("title and url missing, respose is 400", async () => {
    const newBlog = {
      author: "Nevena Radovic",
    }

    await api
      .post("/api/blogs")
      .set({ Authorization: `bearer ${token}` })
      .send(newBlog)
      .expect(400)
  })
})

describe("when we don't include a token", () => {
  test("a valid blog can't be added", async () => {
    const blogsAtStart = await helper.blogsInDb()

    const newBlog = {
      title: "Should't appear",
      author: "Michael Chan",
      likes: 7,
    }

    await api.post("/api/blogs").send(newBlog).expect(401)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length)

    const titles = blogsAtEnd.map((n) => n.title)
    expect(titles).not.toContain("Should't appear")
  })

  test("deletion fails", async () => {
    await api.delete(`/api/blogs/${blogId}`).expect(401)

    const blogsAtEnd = await helper.blogsInDb()

    const titles = blogsAtEnd.map((blog) => blog.title)

    expect(titles).toContain("A blog to test deletion")
  })
})

describe("when we include an invalid token", () => {
  test("a valid blog can't be added", async () => {
    const blogsAtStart = await helper.blogsInDb()

    const newBlog = {
      title: "Should't appear",
      author: "Michael Chan",
      likes: 7,
    }

    await api
      .post("/api/blogs")
      .set({ Authorization: "bearer invalidtoken" })
      .send(newBlog)
      .expect(401)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length)

    const titles = blogsAtEnd.map((n) => n.title)
    expect(titles).not.toContain("Should't appear")
  })

  test("deletion fails", async () => {
    await api
      .delete(`/api/blogs/${blogId}`)
      .set({ Authorization: "bearer invalidtoken" })
      .expect(401)

    const blogsAtEnd = await helper.blogsInDb()

    const titles = blogsAtEnd.map((blog) => blog.title)

    expect(titles).toContain("A blog to test deletion")
  })
})

test("user can't delete other user's blog", async () => {
  const result = await api
    .delete(`/api/blogs/${blogId}`)
    .set({ Authorization: `bearer ${token2}` })
    .expect(401)

  expect(result.body.error).toContain("only the author can delete a blogpost")
  const blogsAtEnd = await helper.blogsInDb()
  const titles = blogsAtEnd.map((blog) => blog.title)
  expect(titles).toContain("A blog to test deletion")
})

test("blogs are returned as json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/)
})

test("all blogs are returned", async () => {
  const response = await api.get("/api/blogs")
  const blogsAtStart = await helper.blogsInDb()

  expect(response.body).toHaveLength(blogsAtStart.length)
})

test("blogs have ids", async () => {
  const response = await api.get("/api/blogs")
  for (let blog of response.body) {
    expect(blog.id).toBeDefined()
  }
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

  expect(blogsAtEnd).toHaveLength(blogsAtStart.length)

  const titles = blogsAtEnd.map((blog) => blog.title)

  expect(titles).toContain(modifiedBlog.title)
})

afterAll(() => {
  mongoose.connection.close()
})
