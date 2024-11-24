const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';

function findAll() {
    // Return a promise for the entire operation
    return MongoClient.connect(url, { useNewUrlParser: true })
        .then(client => {
            console.log('1');
            const db = client.db("Company");
            const collection = db.collection('customers');
            console.log('2');

            // Fetch documents with a limit of 10
            return collection.find({}).limit(10).toArray()
                .then(docs => {
                    console.log('3');
                    docs.forEach(doc => console.log(doc));
                    console.log('4');
                })
                .finally(() => {
                    // Ensure the connection is closed
                    client.close();
                    console.log('5');
                });
        })
        .catch(err => {
            // Handle errors
            console.error("Error occurred:", err);
        });
}

// Simulate asynchronous execution using setTimeout
setTimeout(() => {
    findAll().then(() => {
        console.log('iter');
    });
}, 5000);
