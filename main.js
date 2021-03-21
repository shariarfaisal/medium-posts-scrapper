const { fetchMediumPosts, getPostsBiaLink } = require('./controllers')
const express = require('express')
const app = express()
const port = process.env.PORT || 4000 

app.get('/',(req,res) => {
    return res.status(200).send({
        getMediumPostsLinks: {
            method: 'GET',
            link: '/medium?limit={10}'
        },
        getMediumPostsByLinks:{
            method: 'POST',
            link: '/medium',
            body:{
                posts: 'getMediumPostsLinks'
            }
        }
    })
})

app.get('/medium',fetchMediumPosts)
app.post('/medium',getPostsBiaLink)

const server = app.listen(port,() => {
    console.log(`Server running on port ${port}`);
})

server.setTimeout(1000 * 60 * 10)