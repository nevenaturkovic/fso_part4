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
    ? 0
    : {
        title: blogWithMaxLikes.title,
        author: blogWithMaxLikes.author,
        likes: blogWithMaxLikes.likes,
      }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
}
