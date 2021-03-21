const puppeteer = require('puppeteer');


const fetchMediumPosts = async (req,res) => {
    const url = 'https://medium.com/'
    const postLimit = req.query.limit? parseInt(req.query.limit) : 5

    const browser = await puppeteer.launch({ headless: false });
    try{
        const page = await browser.newPage();
        page.setDefaultTimeout(1000 * 60 * 5)
        
        await page.goto(url, {
        waitUntil: 'networkidle2',
        });

        
        let result = await page.evaluate((postLimit) => {
            
            return new Promise((resolve) => {
                // it is necessary to scroll bottom to fetch new posts ...
                window.scrollTo(0,document.body.scrollHeight)

                // get all elements which classes contains (af,dn)
                // because, our observation says almost all posts classes contains af,dn
                const getEle = () => {
                    return document.getElementsByClassName('af dn')
                }

                let arr = []
                let arrLen = 0

                

                // get posts title and link
                const getLinksHandler = (x) => {
                    for(let i in x){
                        // check posts length
                        // if array link is equal to postsLimit, then quite loop 
                        if(arrLen === postLimit){
                            break;
                        }

                        // check element is node ...
                        if(typeof x[i] === 'object'){
                            const e = x[i].querySelector('h2')

                            // make sure title is greater than 20 character ...
                            if(e && e.innerText.length > 20){

                                // is already exists in array ..
                                const exists = arr.find(i => i.title === e.innerText)
                                if(exists){
                                    continue;
                                }

                                // take title and link from dom element ...
                                if(e && e.parentElement.href){
                                    arr.push({
                                        title: e.innerText,
                                        link: e.parentElement.href
                                    })
                                    arrLen++
                                }else if( e && e.parentElement && e.parentElement.parentElement.href){
                                    arr.push({
                                        title: e.innerText,
                                        link: e.parentElement.parentElement.href
                                    })
                                    arrLen++
                                }
                            }
                        }
                    }

                    // resolve array 
                    resolve(arr)
                }

                // set interval to check is new posts fetched 
                const interval = setInterval(() => {

                    // if posts length still less then postlimit, then scroll to bottom to fetch new posts ...
                    if(getEle().length < postLimit){
                        window.scrollTo(0,document.body.scrollHeight)
                    }else{
                        clearInterval(interval)
                        getLinksHandler(getEle())
                    }

                },250)


            })

        },postLimit)

        await page.close()
        await browser.close()
        return res.status(200).send(result)
    }catch(err){
        return res.status(500).send({ message: 'Perhaps medium block or someting worng happened!' })
    }
}



async function getPostsBiaLink(req,res){
    const { posts } = req.body
    if(!posts){
        return res.status(400).send({ message: 'Posts expected!'})
    }else if(Array.isArray(posts)){
        return res.status(400).send({ message: 'Posts should be an array!'})
    }

    const browser = await puppeteer.launch();

    const result =  new Promise((resolve) => {
        let i = 0
        
        async function postMining(post){

            // posts length reached to end, then 
            if(i === post.length){
                await browser.close()
                resolve(posts)
            }

            const p = await browser.newPage()
            p.setDefaultTimeout(1000 * 60 * 10)
            await p.goto(post.link,{
                waitUntil: 'networkidle2'
            })

            try{
                const article = await p.evaluate(() => {
                    return new Promise((resolve) => {
                        const article = document.querySelector('article')
                        resolve(article.innerHTML)
                    })
                })

                post.article = article 

                await p.close()
                
                posts[i] = post 
                i++
                postMining(posts[i])
            }catch(err){
                await p.close()
                await browser.close()
                return res.send(err)
            }
        }

        postMining(posts[i])
    })

    res.status(200).send(result)
}


module.exports = {
    fetchMediumPosts,
    getPostsBiaLink
}