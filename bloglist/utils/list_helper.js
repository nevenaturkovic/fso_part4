var _ = require("lodash")

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, item) => {
    return sum + item.likes
  }

  return blogs.length === 0 ? 0 : blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  const maxLikes = Math.max(...blogs.map((blog) => blog.likes))
  const blogWithMaxLikes = blogs.find((blog) => blog.likes === maxLikes)

  return blogs.length === 0
    ? null
    : {
        title: blogWithMaxLikes.title,
        author: blogWithMaxLikes.author,
        likes: blogWithMaxLikes.likes,
      }
}

const mostBlogs = (blogs) => {
  if (blogs.length !== 0) {
    const blogsByAuthor = _.countBy(blogs, "author")
    const maxBlogs = Math.max(...Object.values(blogsByAuthor))
    const [authorWithMostBlogs, _maxBlogs] = Object.entries(blogsByAuthor).find(
      ([_author, blogs]) => blogs === maxBlogs
    )

    return {
      author: authorWithMostBlogs,
      blogs: maxBlogs,
    }
  }
  return null
}

const mostLikes = (blogs) => {
  if (blogs.length !== 0) {
    var authorsAndLikes = blogs.reduce((aal, blog) => {
      if (blog.author in aal) {
        aal[blog.author] += blog.likes
      } else {
        aal[blog.author] = blog.likes
      }
      return aal
    }, {})

    // var authorsAndLikes = {}
    // for (const blog of blogs) {
    //   if (blog.author in authorsAndLikes) {
    //     authorsAndLikes[blog.author] += blog.likes
    //   } else {
    //     authorsAndLikes[blog.author] = blog.likes
    //   }
    // }

    const maxLikes = Math.max(...Object.values(authorsAndLikes))
    const [authorWithMostLikes, _maxLikes] = Object.entries(
      authorsAndLikes
    ).find(([_author, likes]) => likes === maxLikes)

    return {
      author: authorWithMostLikes,
      likes: maxLikes,
    }
  }
  return null
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}
