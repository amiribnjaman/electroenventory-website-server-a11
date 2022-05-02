const express = require('express');
const app = express()
const port = process.env.PORT || 4000
const cors = require('cors')
require('dotenv').config()

// Middlewares
app.use(cors())
app.use(express.json())


// Mongodb connection
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.urqpl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// mongo run function
(async () => {
    try {
        await client.connect()
        const inventoryCollection = client.db('electronicsInventory').collection('inventories')

        // Insert a single item
        app.post('/inventory', async (req, res) => {
            const data = req.body
            console.log(data);
            const result = await inventoryCollection.insertOne(data)
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

        app.get('/inventory/:id', async (req,res) => {
            const id = req.params
            const query = {_id: ObjectId(id)}
            const result = await inventoryCollection.findOne(query)

            res.send(result)
        })
    }
    finally {

    }
})().catch(console.dir)


// {
//  "name":"iphone",
//  "image":"https://i.ibb.co/KsBY2Q2/trainer2.jpg",
//   "desc":"this is description",
//   "price":"200",
//   "quentity":"2",
//   "spplier_name":"zihad"
// }


app.get('/', (req, res) => {
    res.send('Server ok')
})


app.listen(port, () => {
    console.log('Server running on port', port);
})

