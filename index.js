const express = require('express');
const app = express()
const port = process.env.PORT || 4000
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');

// Middlewares
app.use(cors())
app.use(express.json())

// Middleware for cors issue
// app.use((req, res, next) => {
//     res.header({"Access-Control-Allow-Origin": "*"});
//     next();
//   }) 

// const corsCon = {
//     origin: '*',
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE']
// }
// app.use(cors(corsCon))
// app.options("*", cors(corsCon))

// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Orgin", "*")
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization")
//     next()
// })

// app.use(cors(corsOptions)) 

// Mongodb connection
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.urqpl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.urqpl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// mongo run function
(async () => {
    try {
        await client.connect()
        const inventoryCollection = client.db('electronicsInventory').collection('inventories')


        // JWT token generator
        app.post('/login', (req, res) => {
            const email = req.body
            const token = jwt.sign(email, process.env.SECRET_KEY);
            res.send({ token })
        })

        // Insert a single item
        app.post('/inventory', async (req, res) => {
            const data = req.body
            const result = await inventoryCollection.insertOne(data)
            res.send(result)
        })


        // Get all inventory items
        app.get('/allInventory', async (req, res) => {
            const query = req.query
            const cursor = inventoryCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        // Get first 6 items
        app.get('/inventoryItems', async (req, res) => {
            const query = req.query
            const sort = { length: -1 }
            const limit = 6
            const cursor = inventoryCollection.find(query).sort(sort).limit(limit)
            const result = await cursor.toArray()

            res.send(result)
        })

        // Get a specific item details
        app.get('/inventory/:id', async (req, res) => {
            const id = req.params
            const query = { _id: ObjectId(id) }
            const result = await inventoryCollection.findOne(query)

            res.send(result)
        })

        // Delivered or derecase quantity from a single item
        app.put('/inventory/:id/:quantity', async (req, res) => {
            const id = req.params.id
            const quantity = req.params.quantity
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };

            const updateDocument = {
                $set: {
                    quantity: `${quantity}`
                }
            }
            const result = await inventoryCollection.updateOne(filter, updateDocument, options)
            res.send(result)
        })


        // Delete a single item from database
        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await inventoryCollection.deleteOne(filter)
            res.send(result)
        })

        // Getting my items or loggedin user's items by user id - uid
        app.get('/myItems/:email', async (req, res) => {
            const userEmail = req.params.email
            const token = req.headers.authorization
            const [accessToken, email] = token.split(' ')
            const verifiedToken = verifyAccessToken(accessToken)
            if (verifiedToken.email === email) {
                const filter = { admin_email: userEmail }
                const cursor = inventoryCollection.find(filter)
                const result = await cursor.toArray()
                res.send({ result: result, code: verifiedToken.errCode })
            } else {
                res.send({ message: 'Token dosen\'t valid', code: verifiedToken.errCode })
            }

        })

    }
    finally {

    }
})().catch(console.dir)


app.get('/', (req, res) => {
    res.send('Server ok')
})


// Listening
app.listen(port, () => {
    console.log('Server running on port', port);
})

// Verify access token function
const verifyAccessToken = (accessToken) => {
    let email;
    jwt.verify(accessToken, process.env.SECRET_KEY, function (err, decoded) {
        if (decoded) {
            email = { email: decoded.email, errCode: 401 }
        }
        if (err) {
            email = { err: 'Not found', errCode: 403 }
        }
    });

    return email;
}
