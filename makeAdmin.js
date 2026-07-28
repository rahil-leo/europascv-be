// Run this once to make yourself an admin, after you've registered normally on the site.
// Usage: node makeAdmin.js your@email.com

const mongoose = require('mongoose');
const { mongoConnectionString } = require('./config');
const User = require('./models/User');

const email = process.argv[2];
if (!email) {
    console.log('Usage: node makeAdmin.js your@email.com');
    process.exit(1);
}

mongoose.connect(mongoConnectionString).then(async () => {
    const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    if (!user) {
        console.log('No user found with that email. Register on the site first.');
    } else {
        console.log(`${user.email} is now an admin.`);
    }
    process.exit(0);
});
