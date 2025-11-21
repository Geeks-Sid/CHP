const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = process.argv[2] || 'password';
    const hash = await bcrypt.hash(password, 12);
    console.log(hash);
}

generateHash().catch(console.error);

